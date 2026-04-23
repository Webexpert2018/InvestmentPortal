const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function checkCols() {
  try {
    const schema = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'tax_vault_documents'
      `);
    console.log('Schema columns for tax_vault_documents:', schema.rows.map(r => r.column_name));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCols();
