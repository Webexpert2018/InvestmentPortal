const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function checkAdminDocs() {
  try {
    const adminIds = [
      '8222f3e2-1d28-4dc4-9a2e-0f2861dcdd05',
      '82ad5997-24f0-4b61-9b76-20990628be97',
      'c71f9fe1-032d-4a94-bf6b-6ae6acf090e8',
      '2c158034-a893-4290-9958-86343035e8d7'
    ];
    
    const res = await pool.query(`
      SELECT * FROM investor_documents 
      WHERE investor_id = ANY($1)
    `, [adminIds]);
    
    console.log(`Found ${res.rowCount} documents owned by Admin IDs in 'investor_documents'`);
    res.rows.forEach(d => {
      console.log(`- Name: ${d.file_name}, AdminID: ${d.investor_id}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAdminDocs();
