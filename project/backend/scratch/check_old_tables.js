const { Client } = require('pg');
require('dotenv').config();

async function checkOldTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const tables = ['old_funds', 'old_investments', 'distributions'];
    for (const table of tables) {
      console.log(`\n=== Table: ${table} ===`);
      const cols = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [table]);
      console.table(cols.rows);

      const rowsCount = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`Total rows: ${rowsCount.rows[0].count}`);

      if (parseInt(rowsCount.rows[0].count) > 0) {
        const samples = await client.query(`SELECT * FROM ${table} LIMIT 2`);
        console.log('Sample rows:');
        console.log(samples.rows);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkOldTables();
