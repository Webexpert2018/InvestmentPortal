const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bitcoin_ira'
});

async function checkRecentDocs() {
  try {
    const res = await pool.query(`
      SELECT d.*, u.email, u.role, u.first_name, u.last_name
      FROM investor_documents d
      JOIN users u ON d.investor_id = u.id
      ORDER BY d.uploaded_at DESC
      LIMIT 10
    `);
    
    console.log('--- Last 10 Investor Documents ---');
    res.rows.forEach(d => {
      console.log(`Doc ID: ${d.id}`);
      console.log(`Name: ${d.file_name}`);
      console.log(`Type: ${d.document_type}`);
      console.log(`Owner: ${d.first_name} ${d.last_name} (${d.email}) - Role: ${d.role}`);
      console.log(`Uploaded At: ${d.uploaded_at}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkRecentDocs();
