const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function migrate() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    console.log('⏳ Setting default value for kyc_status...');
    await client.query("ALTER TABLE investors ALTER COLUMN kyc_status SET DEFAULT 'unverified'");
    
    console.log('⏳ Updating existing NULL kyc_status to unverified...');
    const res = await client.query("UPDATE investors SET kyc_status = 'unverified' WHERE kyc_status IS NULL");
    console.log(`✅ Updated ${res.rowCount} rows`);
    
    client.release();
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
