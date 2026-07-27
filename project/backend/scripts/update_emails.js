const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable',
});

async function run() {
  try {
    await pool.query("ALTER TABLE doctor_prospects DROP CONSTRAINT IF EXISTS doctor_prospects_email_key;");
    const res = await pool.query("UPDATE doctor_prospects SET email = 'ishadubey343@gmail.com'");
    console.log(`✅ Successfully dropped unique constraint and updated ${res.rowCount} prospect records in PostgreSQL to 'ishadubey343@gmail.com'!`);
  } catch (err) {
    console.error('Error updating DB:', err);
  } finally {
    await pool.end();
  }
}

run();
