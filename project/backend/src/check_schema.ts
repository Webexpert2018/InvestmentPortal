
import { db } from './config/database';

async function checkSchema() {
  try {
    const res = await db.query('SELECT * FROM notifications LIMIT 1');
    console.log('--- NOTIFICATION ROW ---');
    console.log(JSON.stringify(res.rows[0], null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
