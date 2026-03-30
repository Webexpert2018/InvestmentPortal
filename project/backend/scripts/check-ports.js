const { Pool } = require('pg');
require('dotenv').config();

async function testPort(port) {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'bitcoin_ira',
    password: process.env.DB_PASSWORD || 'Admin@123',
    port: port,
  });

  try {
    console.log(`Testing port ${port}...`);
    const res = await pool.query('SELECT NOW()');
    console.log(`✅ Success on port ${port}: `, res.rows[0].now);
    return true;
  } catch (err) {
    console.log(`❌ Failed on port ${port}: `, err.message);
    return false;
  } finally {
    await pool.end();
  }
}

async function run() {
  await testPort(5433);
  await testPort(5432);
}

run();
