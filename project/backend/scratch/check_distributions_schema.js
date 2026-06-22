const { Client } = require('pg');
require('dotenv').config();

async function checkDistributionsSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check columns
    const columnsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'distributions'
    `);
    console.log('--- Columns in distributions table ---');
    console.table(columnsRes.rows);

    // Get a sample row
    const sampleRes = await client.query('SELECT * FROM distributions LIMIT 3');
    console.log('--- Sample rows in distributions table ---');
    console.log(JSON.stringify(sampleRes.rows, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkDistributionsSchema();
