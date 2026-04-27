
import { db } from './config/database';

async function checkNotifications() {
  try {
    const res = await db.query('SELECT id, title, type, link FROM notifications ORDER BY created_at DESC LIMIT 10');
    console.log('--- LATEST NOTIFICATIONS ---');
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkNotifications();
