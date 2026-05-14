
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runReorganization() {
  const connectionString = 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to database.');

    const sqlPath = path.join(__dirname, 'reorganize_ira_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🔄 Executing reorganization script...');
    await client.query(sql);
    console.log('✅ Table reorganization complete! Email is now positioned near the top/middle.');

  } catch (err) {
    console.error('❌ Error during reorganization:', err.message);
  } finally {
    await client.end();
  }
}

runReorganization();
