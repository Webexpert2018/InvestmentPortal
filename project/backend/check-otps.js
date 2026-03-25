const { Client } = require('pg');
require('dotenv').config();

async function checkOtps() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query('SELECT * FROM user_otps ORDER BY created_at DESC LIMIT 5');
    console.log('Last 5 rows in user_otps:');
    console.table(res.rows);
    
    const countRes = await client.query('SELECT COUNT(*) FROM user_otps');
    console.log(`Total rows in user_otps: ${countRes.rows[0].count}`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkOtps();
