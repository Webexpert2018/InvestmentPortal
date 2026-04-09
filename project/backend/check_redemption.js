const { db } = require('./src/config/database');

async function check() {
  try {
    const query = `
      SELECT r.id, r.amount, r.units, f.name as fund_name, f.unit_price as live_nav
      FROM redemptions r
      JOIN investments i ON r.investment_id = i.id
      JOIN funds f ON i.fund_id = f.id
      WHERE r.id = '1b931442-ff91-43df-b132-41912352f48f'
    `;
    const result = await db.query(query);
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
