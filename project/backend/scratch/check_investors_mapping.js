const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    console.log('\n--- Columns of distributions table ---');
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'distributions'
    `);
    console.log(cols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

    console.log('\n--- Sample rows from distributions ---');
    const sample = await client.query(`
      SELECT * 
      FROM distributions 
      LIMIT 3
    `);
    console.log(sample.rows);

    console.log('\n--- Sample project_id 66198 rows from distributions ---');
    const projectSample = await client.query(`
      SELECT * 
      FROM distributions 
      WHERE project_id = 66198 OR project_id = '66198'
      LIMIT 3
    `);
    console.log(projectSample.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
