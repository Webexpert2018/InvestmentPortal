import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Construct connection string from individual variables if DATABASE_URL is missing
const getConnectionString = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const user = process.env.DB_USER || process.env.PGUSER || 'postgres';
  const password = process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres';
  const host = process.env.DB_HOST || process.env.PGHOST || 'localhost';
  const port = process.env.DB_PORT || process.env.PGPORT || '5432';
  const database = process.env.DB_NAME || process.env.PGDATABASE || 'bitcoin_ira';

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
};

const connectionString = getConnectionString();

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('sslmode=disable') ? false : {
    rejectUnauthorized: false,
  },
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('🔄 Connecting to database...');
    console.log(`   Connection String: ${process.env.DATABASE_URL?.replace(/:[^@]*@/, ':****@')}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`\n📂 Found ${migrationFiles.length} migration file(s):\n`);

    // Ensure migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get list of executed migrations
    const executedResult = await client.query('SELECT name FROM migrations');
    const executedMigrations = new Set(executedResult.rows.map(row => row.name));

    for (const file of migrationFiles) {
      if (executedMigrations.has(file)) {
        console.log(`   ⏭️  Skipping: ${file} (already executed)`);
        continue;
      }

      console.log(`   ⏳ Running migration: ${file}`);

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Run migration within a transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [file]);
        await client.query('COMMIT');
        console.log(`   ✅ Completed: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`   ❌ Failed: ${file}`);
        throw err;
      }
    }

    console.log('\n✅ Database is up to date!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
