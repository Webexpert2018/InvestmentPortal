const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function checkInvestor() {
  const email = 'pakofa3393@hacknapp.com';
  try {
    const res = await pool.query('SELECT * FROM investors WHERE email = $1', [email]);
    if (res.rowCount === 0) {
      console.log(`❌ Investor with email ${email} not found in 'investors' table.`);
      return;
    }
    const inv = res.rows[0];
    console.log(`✅ Found Investor in 'investors' table: ${inv.id} (${inv.firstName} ${inv.lastName})`);
    
    const docsRes = await pool.query('SELECT * FROM investor_documents WHERE investor_id = $1', [inv.id]);
    console.log(`Found ${docsRes.rowCount} documents for investor:`);
    docsRes.rows.forEach(d => {
      console.log(`- Name: ${d.file_name}, Type: ${d.document_type}, URL: ${d.file_url}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkInvestor();
