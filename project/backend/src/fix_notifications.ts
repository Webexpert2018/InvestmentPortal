
import { db } from './config/database';

async function fixNotificationLinks() {
  try {
    console.log('🔄 Fixing Funding Request links...');
    const fundingQuery = `
      UPDATE notifications 
      SET link = '/dashboard/funding-requests/' || (
        SELECT id FROM investments 
        WHERE user_id = notifications.user_id 
        ORDER BY created_at DESC LIMIT 1
      )
      WHERE type IN ('fund_request', 'subscription') AND link LIKE '/dashboard/investor/%'
    `;
    const res1 = await db.query(fundingQuery);
    console.log(`✅ Updated ${res1.rowCount} funding notification links.`);

    console.log('🔄 Fixing Redemption Request links...');
    const redemptionQuery = `
      UPDATE notifications 
      SET link = '/dashboard/redemption-requests/' || (
        SELECT id FROM redemptions 
        WHERE investor_id = notifications.user_id 
        ORDER BY created_at DESC LIMIT 1
      )
      WHERE type = 'redemption' AND link LIKE '/dashboard/investor/%'
    `;
    const res2 = await db.query(redemptionQuery);
    console.log(`✅ Updated ${res2.rowCount} redemption notification links.`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing notification links:', err);
    process.exit(1);
  }
}

fixNotificationLinks();
