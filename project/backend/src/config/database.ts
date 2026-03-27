import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load env vars only in local development
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
  dotenv.config();
}

// Construct connection string from individual variables if DATABASE_URL is missing
const getConnectionString = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  // Only use fallbacks if we're NOT on Vercel or if explicitly provided
  const user = process.env.DB_USER || process.env.PGUSER || 'postgres';
  const password = process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres';
  const host = process.env.DB_HOST || process.env.PGHOST || 'localhost';
  const port = process.env.DB_PORT || process.env.PGPORT || '5432';
  const database = process.env.DB_NAME || process.env.PGDATABASE || 'bitcoin_ira';

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
};

const connectionString = getConnectionString();

console.log('📡 Database Configuration:');
console.log(`   Connection String: ${connectionString.replace(/:[^@]*@/, ':****@')}`);
console.log(`   Method: ${process.env.DATABASE_URL ? 'DATABASE_URL' : 'Individual Variables'}`);

if (!connectionString) {
  console.error('❌ ERROR: Database configuration is missing');
  throw new Error('DATABASE_URL or individual DB_* environment variables are required');
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Fix TypeScript error: explicitly type 'err'
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  // Remove process.exit(-1); - In serverless, it's better to let the handler fail than to kill the process
});

export const db = pool;

export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected successfully at', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
