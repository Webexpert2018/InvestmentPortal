import { db } from './src/config/database';

async function run() {
  try {
    const result = await db.query('SELECT email, password_hash, LENGTH(password_hash) as hash_len FROM users');
    console.table(result.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
