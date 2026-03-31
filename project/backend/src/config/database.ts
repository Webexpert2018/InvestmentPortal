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

// Using a lazy pool initialization to prevent crashes during the loading phase of serverless functions
let pool: Pool;

const getPool = () => {
  if (pool) return pool;

  const connectionString = getConnectionString();

  if (!connectionString) {
    console.error('❌ ERROR: Database configuration is missing');
    // We don't throw here any more; let the first query fail with a better error message
    // or let the bootstrap check handle it.
  }

  pool = new Pool({
    connectionString,
    ssl: connectionString?.includes('sslmode=require') || process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
      ? { rejectUnauthorized: false }
      : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
  });

  return pool;
};

export const db = {
  query: (text: string, params?: any[]) => getPool().query(text, params),
  connect: () => getPool().connect(),
  on: (event: any, callback: (...args: any[]) => void) => getPool().on(event, callback),
  end: () => pool ? pool.end() : Promise.resolve(),
};

export async function testConnection() {
  try {
    const client = await getPool().connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected successfully at', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
