const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function checkInvestorId() {
  const id = '99b6e6d7-3335-40f1-b791-b54b5b98de2b';
  try {
    const res = await pool.query('SELECT * FROM investors WHERE id = $1', [id]);
    if (res.rowCount === 0) {
      console.log(`❌ Investor with ID ${id} NOT FOUND in 'investors' table.`);
      return;
    }
    const inv = res.rows[0];
    console.log(`✅ Found Investor: ${inv.email} (${inv.id})`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkInvestorId();
