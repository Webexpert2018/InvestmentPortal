const { Pool } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: false 
});

async function run() {
  try {
    const sql = fs.readFileSync('migrations/013_create_ira_account_types.sql', 'utf-8');
    await pool.query(sql);
    console.log('✅ Migration 013 Success');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration 013 Failed:', err);
    process.exit(1);
  }
}

run();
