const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function checkTaxVault() {
  const investorId = 'd2b93822-e826-4070-9c94-96cbc9657e43';
  try {
    const res = await pool.query('SELECT * FROM tax_vault_documents WHERE user_id = $1', [investorId]);
    console.log(`Found ${res.rowCount} documents for investor in 'tax_vault_documents'`);
    res.rows.forEach(d => {
      console.log(`- Name: ${d.file_name}, At: ${d.uploaded_at}, Type: ${d.document_type}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTaxVault();
