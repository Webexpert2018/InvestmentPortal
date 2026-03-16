import { db } from './src/config/database';

async function run() {
  try {
    const result = await db.query('SELECT email, password_hash, LENGTH(password_hash) as len FROM users');
    for (const row of result.rows) {
        console.log(`Email: ${row.email} | Hash: ${row.password_hash} | Length: ${row.len}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
