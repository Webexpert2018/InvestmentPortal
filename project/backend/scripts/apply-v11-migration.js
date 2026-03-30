const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function applyMigration() {
  try {
    console.log('Applying migration 011_update_funds_schema.sql...');
    
    await pool.query(`
      ALTER TABLE funds 
      ADD COLUMN IF NOT EXISTS start_date DATE,
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active',
      ADD COLUMN IF NOT EXISTS note TEXT;
    `);
    
    await pool.query(`
      UPDATE funds SET start_date = created_at::DATE WHERE start_date IS NULL;
    `);
    
    await pool.query(`
      UPDATE funds SET status = 'Active' WHERE status IS NULL;
    `);

    console.log('Migration applied successfully!');
  } catch (err) {
    console.error('Error applying migration:', err.message);
  } finally {
    await pool.end();
  }
}

applyMigration();
