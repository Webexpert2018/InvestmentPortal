const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query(`
  ALTER TABLE investors ADD COLUMN IF NOT EXISTS nickname VARCHAR(100) DEFAULT NULL;
  CREATE INDEX IF NOT EXISTS idx_investors_nickname ON investors (LOWER(nickname));
`)
  .then(() => {
    console.log('✅ Migration 115 applied successfully: nickname column added to investors');
    pool.end();
  })
  .catch(e => {
    console.error('❌ Migration error:', e.message);
    pool.end();
    process.exit(1);
  });
