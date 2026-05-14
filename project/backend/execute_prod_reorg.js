
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runProductionReorganization() {
  // 1. Production Database URL from your .env
  const connectionString = 'postgresql://neondb_owner:npg_4R9iFEyauPXH@ep-dawn-shadow-ammmohw4-pooler.c-5.us-east-1.aws.neon.tech/bitcoin_ira?sslmode=require';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to LIVE PRODUCTION database (Neon).');

    // 2. Pre-check: Count records to ensure backup is perfect
    const countResult = await client.query('SELECT COUNT(*) FROM ira_accounts');
    const rowCount = countResult.rows[0].count;
    console.log(`📊 Current Live Records: ${rowCount}`);

    const sqlPath = path.join(__dirname, 'reorganize_ira_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🔄 Executing reorganization script on LIVE SERVER...');
    await client.query(sql);
    
    // 3. Post-check: Verify all records were restored
    const finalCountResult = await client.query('SELECT COUNT(*) FROM ira_accounts');
    const finalRowCount = finalCountResult.rows[0].count;
    
    if (rowCount === finalRowCount) {
      console.log(`✅ Production Reorganization COMPLETE! All ${finalRowCount} records preserved.`);
    } else {
      console.error(`⚠️ WARNING: Record mismatch! Initial: ${rowCount}, Final: ${finalRowCount}`);
    }

  } catch (err) {
    console.error('❌ Error during PRODUCTION reorganization:', err.message);
  } finally {
    await client.end();
  }
}

runProductionReorganization();
