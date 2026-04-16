const { Client } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const migrationPath = process.argv[2];

if (!migrationPath) {
  console.error('Please provide a migration file path.');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    await client.connect();
    console.log(`Running migration: ${path.basename(migrationPath)}`);
    await client.query(sql);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
