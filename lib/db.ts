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

// Database query helper
export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
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

export default pool;
