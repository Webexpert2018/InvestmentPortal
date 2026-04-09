const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'invest_portal',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
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
