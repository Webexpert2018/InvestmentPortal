const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'bitcoin_ira',
  password: process.env.DB_PASSWORD || 'Admin@123',
  port: parseInt(process.env.DB_PORT || '5433'),
});

async function checkTables() {
  try {
    console.log('Testing connection to:', process.env.DB_HOST, ':', process.env.DB_PORT);
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('funds', 'fund_flows')
    `);
    
    console.log('Found tables:', res.rows.map(r => r.table_name));
    
    const users = await pool.query('SELECT count(*) FROM users');
    console.log('Users count:', users.rows[0].count);

  } catch (err) {
    console.error('Error checking tables:', err.message);
  } finally {
    await pool.end();
  }
}

checkTables();
