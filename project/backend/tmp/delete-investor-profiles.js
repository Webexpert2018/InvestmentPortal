const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function run() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    console.log('⏳ Dropping table investor_profiles CASCADE...');
    await client.query('DROP TABLE IF EXISTS investor_profiles CASCADE');
    console.log('✅ Table investor_profiles successfully dropped.');

    client.release();
  } catch (err) {
    console.error('❌ Deletion failed:', err.message);
  } finally {
    await pool.end();
  }
}

run();
