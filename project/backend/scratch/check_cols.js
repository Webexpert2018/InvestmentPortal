const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    console.log('--- fund_documents columns ---');
    const res = await client.query("SELECT * FROM fund_documents LIMIT 0");
    console.log(res.fields.map(f => f.name));

    console.log('--- investor_documents columns ---');
    const res2 = await client.query("SELECT * FROM investor_documents LIMIT 0");
    console.log(res2.fields.map(f => f.name));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
