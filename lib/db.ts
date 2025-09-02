import { Pool } from 'pg';

// Database connection that works with ANY PostgreSQL provider
const connectionString =
    process.env.POSTGRES_URL ||           // Vercel Postgres
    process.env.DATABASE_URL ||           // Supabase/Railway/etc
    process.env.SUPABASE_DB_URL ||        // Supabase direct
    process.env.DB_CONNECTION_STRING;     // Custom PostgreSQL

if (!connectionString) {
  throw new Error('No database connection string found. Please set POSTGRES_URL, DATABASE_URL, or DB_CONNECTION_STRING environment variable.');
}

// Create connection pool for serverless functions
const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Track initialization to avoid multiple runs
let isInitialized = false;

export async function initializeDatabase() {
  if (isInitialized) {
    console.log('Database already initialized, skipping...');
    return;
  }

  const client = await pool.connect();
  try {
    console.log('🐘 Initializing PostgreSQL database...');

    // Test database connection first
    console.log('🔍 Testing database connection...');
    await client.query('SELECT 1 as test');
    console.log('✅ Database connection successful');

    console.log('📋 Creating users table...');
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

    console.log('🔍 Creating indexes for better performance...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON user_progress(module_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_module ON lesson_progress(user_id, module_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(certificate_code)');

    isInitialized = true;
    console.log('✅ All database tables created successfully');
    console.log('📊 Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Auto-initialize on first query (for Vercel deployment)
let autoInitPromise: Promise<void> | null = null;

async function ensureInitialized() {
  if (isInitialized) return;

  if (!autoInitPromise) {
    autoInitPromise = initializeDatabase().catch(error => {
      console.warn('Auto-initialization failed:', error);
    });
  }

  await autoInitPromise;
}

// Database query helper with auto-initialization
export async function query(text: string, params?: unknown[]) {
  // Auto-initialize if not already done
  await ensureInitialized();

  const client = await pool.connect();
  try {
    console.log('Executing query:', text, 'with params:', params);
    const result = await client.query(text, params);
    console.log(`Query executed, returned ${result.rowCount} rows`);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Transaction helper
export async function transaction<T>(callback: (client: import('pg').PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    console.log('Running health check...');
    const result = await query('SELECT 1 as health_check');
    console.log('Health check result:', result.rows);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

export default pool;