const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    console.log('--- fund_documents table schema ---');
    const res = await client.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'fund_documents'
    `);
    console.log(res.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
