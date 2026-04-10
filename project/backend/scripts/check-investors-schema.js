const { Client } = require('pg');
require('dotenv').config();

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Checking INVESTORS table columns...');
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'investors'
      ORDER BY ordinal_position;
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('Error fetching schema:', err);
  } finally {
    await client.end();
  }
}

checkSchema();
