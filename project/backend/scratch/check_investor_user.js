const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function checkInvestorUser() {
  try {
    const res = await pool.query("SELECT * FROM investors WHERE email = 'investor_user@gmail.com'");
    console.log('Investor User Details:', res.rows[0]);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkInvestorUser();
