const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function repair() {
  try {
    // 1. Fetch latest active NAV
    const navRes = await pool.query("SELECT nav_per_unit FROM fund_nav_history WHERE status = 'active' ORDER BY effective_date DESC LIMIT 1");
    if (navRes.rows.length === 0) {
      console.log('No active NAV found. Cannot repair.');
      await pool.end();
      return;
    }
    const currentNav = parseFloat(navRes.rows[0].nav_per_unit);
    console.log(`Current Active NAV: $${currentNav}`);

    // 2. Find all Pending redemptions
    const pendingRes = await pool.query("SELECT id, amount, units FROM redemptions WHERE status = 'Pending'");
    console.log(`Found ${pendingRes.rows.length} pending redemption(s).`);

    for (const row of pendingRes.rows) {
      const amount = parseFloat(row.amount);
      const oldUnits = parseFloat(row.units);
      const newUnits = amount / currentNav;
      
      if (Math.abs(oldUnits - newUnits) > 0.00000001) {
        console.log(`Fixing RED-${row.id.substring(0, 6)}: ${oldUnits} -> ${newUnits.toFixed(8)} units`);
        await pool.query('UPDATE redemptions SET units = $1 WHERE id = $2', [newUnits, row.id]);
      } else {
        console.log(`RED-${row.id.substring(0, 6)} is already correct.`);
      }
    }

    // 3. Update funds table unit_price just in case
    await pool.query("UPDATE funds SET unit_price = $1 WHERE unit_price != $1", [currentNav]);
    console.log('Funds table unit_price synchronized.');

    console.log('✅ Repair complete.');
    await pool.end();
  } catch (err) {
    console.error('❌ Repair failed:', err);
    await pool.end();
  }
}

repair();
