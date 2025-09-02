import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Get connection string
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ No database connection string found!');
  console.error('Make sure DATABASE_URL or POSTGRES_URL is set in your .env.local file');
  process.exit(1);
}

// Create pool with explicit SSL for Neon
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Always use SSL for Neon
  max: 1, // Single connection for script
});

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log('🐘 Starting PostgreSQL database initialization...\n');

    // Test connection
    console.log('🔍 Testing database connection...');
    const testResult = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Connection successful!');
    console.log('   Time:', testResult.rows[0].current_time);
    console.log('   PostgreSQL Version:', testResult.rows[0].pg_version.split(' ')[0]);
    console.log('');

    // Check if tables already exist
    console.log('🔍 Checking existing tables...');
    const existingTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'modules', 'user_progress', 'lesson_progress', 'certificates')
    `);

    if (existingTables.rows.length > 0) {
      console.log('⚠️  Found existing tables:', existingTables.rows.map(r => r.table_name).join(', '));
      console.log('   This script will create tables only if they don\'t exist.\n');
    } else {
      console.log('✅ No existing tables found. Will create all tables.\n');
    }

    // Create users table
    console.log('👥 Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table ready');

    // Create modules table
    console.log('📚 Creating modules table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        content JSONB NOT NULL,
        version VARCHAR(50) DEFAULT '1.0.0',
        author TEXT,
        difficulty_level VARCHAR(50) DEFAULT 'beginner',
        tags JSONB DEFAULT '[]',
        estimated_duration INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Modules table ready');

    // Create user_progress table
    console.log('📊 Creating user_progress table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        progress_percentage INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        completion_date TIMESTAMP,
        total_time_spent INTEGER DEFAULT 0,
        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, module_id)
      )
    `);
    console.log('✅ User progress table ready');

    // Create lesson_progress table
    console.log('📝 Creating lesson_progress table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        lesson_id TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        time_spent INTEGER DEFAULT 0,
        quiz_score INTEGER,
        completed_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, module_id, lesson_id)
      )
    `);
    console.log('✅ Lesson progress table ready');

    // Create certificates table
    console.log('🏆 Creating certificates table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        certificate_code TEXT UNIQUE NOT NULL,
        certificate_data JSONB,
        verified BOOLEAN DEFAULT TRUE,
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, module_id)
      )
    `);
    console.log('✅ Certificates table ready');

    // Create indexes
    console.log('🔍 Creating performance indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON user_progress(module_id)',
      'CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_module ON lesson_progress(user_id, module_id)',
      'CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(certificate_code)'
    ];

    for (const indexQuery of indexes) {
      await client.query(indexQuery);
    }
    console.log('✅ All indexes created');

    // Verify tables were created
    console.log('\n🔍 Verifying table creation...');
    const finalTables = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'modules', 'user_progress', 'lesson_progress', 'certificates')
      ORDER BY table_name
    `);

    console.log('📋 Created tables:');
    finalTables.rows.forEach(table => {
      console.log(`   ✅ ${table.table_name} (${table.column_count} columns)`);
    });

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('   You can now run your registration endpoint.');

  } catch (error) {
    console.error('\n❌ Database initialization failed:');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Code:', error.code);
    }
    if (error.detail) {
      console.error('Detail:', error.detail);
    }
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await initializeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⏹️  Script interrupted. Cleaning up...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Script terminated. Cleaning up...');
  await pool.end();
  process.exit(0);
});

main();