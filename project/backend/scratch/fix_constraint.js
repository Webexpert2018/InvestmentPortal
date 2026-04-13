const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:Spadez@123@127.0.0.1:5432/bitcoin_ira'
});

async function run() {
  try {
    await pool.query('ALTER TABLE fund_documents ALTER COLUMN fund_id DROP NOT NULL');
    console.log('Successfully made fund_id nullable');
  } catch (err) {
    console.error('Failed to alter table:', err.message);
  } finally {
    await pool.end();
  }
}

run();
