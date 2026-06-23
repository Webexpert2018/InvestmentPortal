const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    console.log('\n--- Checking investment ID mapping ---');
    const testQuery = await client.query(`
      SELECT d.investment_id, o.investment_ownership_id, o.ownership, o.investor_profile_legal_name
      FROM distributions d 
      INNER JOIN old_investments o ON d.investment_id = o.investment_ownership_id
      LIMIT 5
    `);
    console.log(testQuery.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
