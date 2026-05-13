const { db } = require('./dist/config/database');
async function check() {
  try {
    const res = await db.query("SELECT id, status FROM investors LIMIT 5");
    console.log('INVESTORS:', JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error('ERROR:', e);
  }
  process.exit(0);
}
check();
