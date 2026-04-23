
import { db } from './config/database';

async function powerFix() {
  try {
    // 1. Get all fund_request notifications with null link
    const notifs = await db.query(
      "SELECT id, created_at, description FROM notifications WHERE (type = 'fund_request' OR title LIKE 'New Fund Request%') AND link IS NULL"
    );
    console.log(`🔍 Found ${notifs.rows.length} funding notifications to fix.`);

    for (const n of notifs.rows) {
      // Find an investment created around the same time (+/- 2 minutes to be safe)
      const invRes = await db.query(
        "SELECT id FROM investments WHERE created_at >= $1::timestamp - interval '2 minutes' AND created_at <= $1::timestamp + interval '2 minutes' ORDER BY ABS(EXTRACT(EPOCH FROM (created_at - $1::timestamp))) ASC LIMIT 1",
        [n.created_at]
      );
      
      if (invRes.rows.length > 0) {
        await db.query("UPDATE notifications SET link = $1 WHERE id = $2", 
          [`/dashboard/funding-requests/${invRes.rows[0].id}`, n.id]);
        console.log(`✅ Fixed funding notification ${n.id} -> Linking to Request ${invRes.rows[0].id}`);
      } else {
         // Fallback: just link to general list if specific one can't be matched
         await db.query("UPDATE notifications SET link = '/dashboard/funding' WHERE id = $1", [n.id]);
         console.log(`⚠️ Could not find exact match for ${n.id}, linking to general funding list.`);
      }
    }

    // 2. Get all redemption notifications with null link
    const redNotifs = await db.query(
      "SELECT id, created_at FROM notifications WHERE (type = 'redemption' OR title LIKE 'New Redemption%') AND link IS NULL"
    );
    console.log(`🔍 Found ${redNotifs.rows.length} redemption notifications to fix.`);

    for (const n of redNotifs.rows) {
      const redRes = await db.query(
        "SELECT id FROM redemptions WHERE created_at >= $1::timestamp - interval '2 minutes' AND created_at <= $1::timestamp + interval '2 minutes' ORDER BY ABS(EXTRACT(EPOCH FROM (created_at - $1::timestamp))) ASC LIMIT 1",
        [n.created_at]
      );
      
      if (redRes.rows.length > 0) {
        await db.query("UPDATE notifications SET link = $1 WHERE id = $2", 
          [`/dashboard/redemption-requests/${redRes.rows[0].id}`, n.id]);
        console.log(`✅ Fixed redemption notification ${n.id} -> Linking to Request ${redRes.rows[0].id}`);
      } else {
         await db.query("UPDATE notifications SET link = '/dashboard/redemption' WHERE id = $1", [n.id]);
         console.log(`⚠️ Could not find exact match for ${n.id}, linking to general redemption list.`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during power fix:', err);
    process.exit(1);
  }
}

powerFix();
