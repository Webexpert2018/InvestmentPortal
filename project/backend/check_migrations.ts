import { db } from './src/config/database';

async function check() {
  try {
    const res = await db.query('SELECT * FROM migrations ORDER BY executed_at DESC');
    console.log('Executed migrations:');
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
