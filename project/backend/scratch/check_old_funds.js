const { Client } = require('pg');
require('dotenv').config();

async function checkOldFunds() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`\n=== Table: old_funds ===`);
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'old_funds'
      ORDER BY ordinal_position;
    `);
    console.table(cols.rows);

    const rowsCount = await client.query(`SELECT COUNT(*) FROM old_funds`);
    console.log(`Total rows: ${rowsCount.rows[0].count}`);

    if (parseInt(rowsCount.rows[0].count) > 0) {
      const samples = await client.query(`SELECT * FROM old_funds LIMIT 10`);
      console.log('Sample rows:');
      console.log(samples.rows);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkOldFunds();
