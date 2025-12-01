import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'bitcoin_ira',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('🔄 Connecting to database...');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'bitcoin_ira'}`);
    console.log(`   User: ${process.env.DB_USER || 'postgres'}`);

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
