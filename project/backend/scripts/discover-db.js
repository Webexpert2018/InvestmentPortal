const { Pool } = require('pg');

async function tryConnect(config) {
  const pool = new Pool({
    ...config,
    connectionTimeoutMillis: 2000,
  });
  try {
    const res = await pool.query('SELECT current_database(), current_user');
    console.log(`✅ SUCCESS: Port ${config.port}, User ${config.user}, DB ${res.rows[0].current_database}`);
    return true;
  } catch (err) {
    console.log(`❌ FAILED: Port ${config.port}, User ${config.user}, Error: ${err.message}`);
    return false;
  } finally {
    await pool.end();
  }
}

async function run() {
  const port = 5432;
  const db = 'postgres'; // Try default DB first
  
  await tryConnect({ port, user: 'postgres', password: '', database: db });
  await tryConnect({ port, user: 'postgres', password: 'password', database: db });
  await tryConnect({ port, user: 'postgres', password: 'postgres', database: db });
  await tryConnect({ port, user: 'postgres', password: 'Admin@123', database: db });
}

run();
