const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
console.log('Testing connection to:', connectionString.replace(/:[^@]*@/, ':****@'));

const pool = new Pool({
  connectionString,
  ssl: false
});

async function test() {
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to database');
    const res = await client.query('SELECT current_database(), current_user');
    console.log('   Results:', res.rows[0]);
    client.release();
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    if (err.code) console.error('   Code:', err.code);
  } finally {
    await pool.end();
  }
}

test();
