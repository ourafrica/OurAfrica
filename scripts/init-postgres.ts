import { query } from '../lib/db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing PostgreSQL database...');

    // Read and execute schema
    const schemaPath = path.join(__dirname, '../lib/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split schema into individual statements
    const statements = schema
      .split(';')
      .filter(statement => statement.trim())
      .map(statement => statement.trim());

    // Execute each statement
    for (const statement of statements) {
      if (statement) {
        await query(statement);
      }
    }

    console.log('✅ Database schema initialized successfully');

    // Check if we need to seed data
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const moduleCount = await query('SELECT COUNT(*) as count FROM modules');

    console.log(`📊 Current data: ${userCount.rows[0].count} users, ${moduleCount.rows[0].count} modules`);

    if (parseInt(moduleCount.rows[0].count) === 0) {
      console.log('🌱 Seeding sample data...');
      await seedSampleData();
    }

    console.log('🎉 Database initialization complete!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

async function seedSampleData() {
  try {
    // Read Our Africa University module data
    const ourafriaModulePath = path.join(__dirname, '../src/data/ourafrica-university-module.json');

    if (fs.existsSync(ourafriaModulePath)) {
      const ourafriaModule = JSON.parse(fs.readFileSync(ourafriaModulePath, 'utf8'));
      await query(
        `INSERT INTO modules (title, description, content, version, author, difficulty_level, tags, estimated_duration)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          ourafriaModule.title,
          ourafriaModule.description,
          JSON.stringify(ourafriaModule.content),
          ourafriaModule.version || '1.0.0',
          ourafriaModule.author || 'Our Africa University',
          ourafriaModule.difficulty_level || 'beginner',
          JSON.stringify(ourafriaModule.tags || []),
          ourafriaModule.content?.estimatedTime || null
        ]
      );
      console.log('✅ Our Africa University module seeded successfully');
    } else {
      console.log('⚠️ Our Africa University module file not found');
    }

  } catch (error) {
    console.error('⚠️ Warning: Could not seed Our Africa University module:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export { initializeDatabase };
