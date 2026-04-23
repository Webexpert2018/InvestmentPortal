const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function checkTodayDocs() {
  try {
    const res = await pool.query(`
      SELECT * FROM investor_documents 
      WHERE uploaded_at >= '2026-04-23'
    `);
    
    console.log(`Found ${res.rowCount} documents uploaded today (April 23, 2026) in 'investor_documents'`);
    for (const d of res.rows) {
      console.log(`- Doc: ${d.file_name}, InvestorID: ${d.investor_id}, At: ${d.uploaded_at}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTodayDocs();
