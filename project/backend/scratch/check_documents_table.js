const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function checkDocumentsTable() {
  try {
    const res = await pool.query(`SELECT * FROM documents ORDER BY created_at DESC LIMIT 10`);
    console.log(`Found ${res.rowCount} rows in 'documents' table:`);
    for (const d of res.rows) {
      console.log(`Doc: ${d.file_name}, OwnerID: ${d.owner_id || d.user_id}, Type: ${d.document_type}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDocumentsTable();
