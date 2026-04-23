const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function checkCols() {
  try {
    const res = await pool.query(`SELECT * FROM documents LIMIT 1`);
    if (res.rowCount > 0) {
      console.log('Columns in documents table:', Object.keys(res.rows[0]));
    } else {
      console.log('Documents table is empty.');
      // Still check table schema if possible
      const schema = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'documents'
      `);
      console.log('Schema columns:', schema.rows.map(r => r.column_name));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCols();
