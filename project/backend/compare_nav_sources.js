const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function compare() {
  try {
    console.log('--- Funds Table ---');
    const fundsRes = await pool.query('SELECT name, unit_price FROM funds');
    console.log(JSON.stringify(fundsRes.rows, null, 2));

    console.log('\n--- Active NAV History ---');
    const navRes = await pool.query("SELECT nav_per_unit, effective_date, status FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1");
    console.log(JSON.stringify(navRes.rows, null, 2));

    await pool.end();
  } catch (err) {
    console.error(err);
    await pool.end();
  }
}

compare();
