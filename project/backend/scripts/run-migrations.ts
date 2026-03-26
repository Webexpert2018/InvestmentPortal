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
  ssl: {
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

    for (const file of migrationFiles) {
      console.log(`   ⏳ Running migration: ${file}`);

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      await client.query(sql);

      console.log(`   ✅ Completed: ${file}`);
    }

    console.log('\n✅ All migrations completed successfully!');
    console.log('\n📊 Database is ready to use.');

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
