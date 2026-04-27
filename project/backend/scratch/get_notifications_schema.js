const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

async function checkActualColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bitcoin_ira'
  });

  try {
    await client.connect();
    
    console.log('--- Notifications Table Structure ---');
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position
    `);
    console.table(cols.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkActualColumns();
