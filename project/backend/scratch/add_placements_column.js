const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bitcoin_ira';
const pool = new Pool({ connectionString });

async function run() {
  try {
    console.log('Altering funds table to add placements column...');
    await pool.query('ALTER TABLE funds ADD COLUMN IF NOT EXISTS placements JSONB DEFAULT NULL');
    console.log('✅ Successfully added placements JSONB column!');
  } catch (error) {
    console.error('❌ Error altering table:', error);
  } finally {
    await pool.end();
  }
}
run();
