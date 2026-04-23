const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bitcoin_ira'
});

async function checkIds() {
  try {
    console.log('--- Investor Documents Ids ---');
    const invDocs = await pool.query(`SELECT id, investor_id, file_name FROM investor_documents`);
    invDocs.rows.forEach(r => console.log(`Doc: ${r.id}, InvestorID: ${r.investor_id}, File: ${r.file_name}`));
    
    console.log('\n--- User Ids ---');
    const users = await pool.query(`SELECT id, email FROM users`);
    users.rows.forEach(r => console.log(`User: ${r.id}, Email: ${r.email}`));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkIds();
