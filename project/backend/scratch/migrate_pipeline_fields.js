const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log('Adding expected_future_investment column...');
    await pool.query(`
      ALTER TABLE investors 
      ADD COLUMN IF NOT EXISTS expected_future_investment NUMERIC DEFAULT 0;
    `);
    console.log('Column added successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
