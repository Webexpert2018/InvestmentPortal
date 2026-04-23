const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bitcoin_ira'
});

async function countRows() {
  try {
    const invDocs = await pool.query(`SELECT COUNT(*) FROM investor_documents`);
    console.log('Total rows in investor_documents:', invDocs.rows[0].count);
    
    const fundDocs = await pool.query(`SELECT COUNT(*) FROM fund_documents`);
    console.log('Total rows in fund_documents:', fundDocs.rows[0].count);

    const users = await pool.query(`SELECT COUNT(*) FROM users`);
    console.log('Total rows in users:', users.rows[0].count);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

countRows();
