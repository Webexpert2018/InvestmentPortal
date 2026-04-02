const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log('🔄 Connecting to database...');
  try {
    await client.connect();
    console.log('✅ Connected');
    await client.query('ALTER TABLE fund_documents ADD COLUMN IF NOT EXISTS file_size BIGINT;');
    console.log('✅ Column file_size added to fund_documents');
    await client.query("INSERT INTO migrations (name) VALUES ('020_add_file_size_to_fund_documents.sql') ON CONFLICT (name) DO NOTHING;");
    console.log('✅ Migration 020 recorded');
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}
run();
