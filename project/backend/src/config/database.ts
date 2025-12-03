import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load env vars immediately
dotenv.config();

const connectionString = process.env.DATABASE_URL;

console.log('📡 Database Configuration:');
console.log(`   Connection String: ${connectionString?.replace(/:[^@]*@/, ':****@') || 'NOT SET'}`);
console.log(`   Port: ${connectionString?.includes(':') ? 'Using connection string' : 'ERROR: No connection string'}`);

if (!connectionString) {
  console.error('❌ ERROR: DATABASE_URL is not set in .env file');
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Railway SSL
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased from 2000 to 10 seconds
});

// Fix TypeScript error: explicitly type 'err'
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
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
