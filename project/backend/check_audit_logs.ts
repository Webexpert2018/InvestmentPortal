import { db } from './src/config/database';

async function check() {
  try {
    const res = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs' 
      ORDER BY ordinal_position
    `);
    console.log('Columns in audit_logs table:');
    console.log(res.rows.map(r => r.column_name).join(', '));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
