const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bitcoin_ira'
});

async function checkColumns() {
  try {
    const res = await pool.query(`SELECT * FROM users LIMIT 1`);
    console.log('Columns in users table:', Object.keys(res.rows[0]));
    
    const docRes = await pool.query(`SELECT * FROM investor_documents LIMIT 1`);
    console.log('Columns in investor_documents table:', Object.keys(docRes.rows[0]));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkColumns();
