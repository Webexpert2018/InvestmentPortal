const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const id = '3615c158-a517-4bab-aad0-49f3b6df9145';
Promise.all([
  pool.query(`SELECT id, 'users' as table_name FROM users WHERE id = $1`, [id]),
  pool.query(`SELECT id, 'staff' as table_name FROM staff WHERE id = $1`, [id]),
  pool.query(`SELECT id, 'investors' as table_name FROM investors WHERE id = $1`, [id])
]).then(results => {
  results.forEach(res => {
    if (res.rows.length > 0) console.log("FOUND IN:", res.rows[0].table_name);
  });
  console.log("Check complete.");
  pool.end();
}).catch(console.error);
