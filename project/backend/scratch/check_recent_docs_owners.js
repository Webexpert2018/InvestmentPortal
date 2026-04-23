const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function checkRecentDocs() {
  try {
    const res = await pool.query(`
      SELECT d.*
      FROM investor_documents d
      ORDER BY d.uploaded_at DESC
      LIMIT 10
    `);
    
    console.log('--- Last 10 Investor Documents ---');
    for (const d of res.rows) {
      console.log(`Doc ID: ${d.id}`);
      console.log(`Name: ${d.file_name}`);
      console.log(`InvestorID in Doc: ${d.investor_id}`);
      
      // Try to find owner in users
      const userOwner = await pool.query('SELECT email, role FROM users WHERE id = $1', [d.investor_id]);
      if (userOwner.rowCount > 0) {
        console.log(`Owner (User): ${userOwner.rows[0].email} (${userOwner.rows[0].role})`);
      } else {
        // Try to find owner in investors
        const invOwner = await pool.query('SELECT email FROM investors WHERE id = $1', [d.investor_id]);
        if (invOwner.rowCount > 0) {
          console.log(`Owner (Investor): ${invOwner.rows[0].email}`);
        } else {
          console.log(`Owner: UNKNOWN ID ${d.investor_id}`);
        }
      }
      console.log(`Uploaded At: ${d.uploaded_at}`);
      console.log('---');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkRecentDocs();
