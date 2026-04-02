import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('Connected');
  try {
    await client.query('ALTER TABLE fund_documents ADD COLUMN IF NOT EXISTS file_size BIGINT;');
    console.log('Column added');
    await client.query("INSERT INTO migrations (name) VALUES ('020_add_file_size_to_fund_documents.sql') ON CONFLICT (name) DO NOTHING;");
    console.log('Migration recorded');
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
run();
