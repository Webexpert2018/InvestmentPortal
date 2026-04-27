
import { db } from './config/database';

async function checkKycNotifications() {
  try {
    const res = await db.query("SELECT id, title, user_id, link FROM notifications WHERE title LIKE '%Request%' ORDER BY created_at DESC LIMIT 10");
    console.log('--- REQUEST NOTIFICATIONS ---');
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkKycNotifications();
