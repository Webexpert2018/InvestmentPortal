const { db } = require('../dist/config/database');
async function check() {
  try {
    const res = await db.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'investors'
    `);
    console.table(res.rows);
  } catch (e) {
    console.error('ERROR:', e);
  }
  process.exit(0);
}
check();








