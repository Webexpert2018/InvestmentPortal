const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function check() {
  try {
    const query = `
      SELECT r.id, r.amount, r.units, f.name as fund_name, f.unit_price as live_nav
      FROM redemptions r
      JOIN investments i ON r.investment_id = i.id
      JOIN funds f ON i.fund_id = f.id
      WHERE r.id = '1b931442-ff91-43df-b132-41912352f48f'
    `;
    const result = await pool.query(query);
    console.log(JSON.stringify(result.rows, null, 2));
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error(err);
    await pool.end();
    process.exit(1);
  }
}

check();
