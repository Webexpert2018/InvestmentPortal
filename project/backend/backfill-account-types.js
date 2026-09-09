const { db } = require('./src/config/database');

async function run() {
  try {
    const res = await db.query(`SELECT id, from_account_id, to_account_id FROM fund_transfers WHERE from_account_type = 'old_investor' OR to_account_type = 'old_investor'`);
    for (const row of res.rows) {
      if (row.from_account_id) {
        const pRes = await db.query(`SELECT profile_type FROM old_investors WHERE ims_profile_id = $1`, [row.from_account_id]);
        if (pRes.rows.length > 0) {
          await db.query(`UPDATE fund_transfers SET from_account_type = $1 WHERE id = $2`, [`ims-${pRes.rows[0].profile_type} account`, row.id]);
        }
      }
      if (row.to_account_id) {
        const pRes = await db.query(`SELECT profile_type FROM old_investors WHERE ims_profile_id = $1`, [row.to_account_id]);
        if (pRes.rows.length > 0) {
          await db.query(`UPDATE fund_transfers SET to_account_type = $1 WHERE id = $2`, [`ims-${pRes.rows[0].profile_type} account`, row.id]);
        }
      }
    }
    console.log('Backfill complete!');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
