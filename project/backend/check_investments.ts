import { db } from './src/config/database';

async function check() {
  try {
    const res = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'investments' 
      ORDER BY ordinal_position
    `);
    console.log('Columns in investments table:');
    console.log(res.rows.map(r => r.column_name).join(', '));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
