const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    console.log('\n--- Sample old_investments rows for project 66198 ---');
    const sampleRows = await client.query(`
      SELECT investor_profile_id, investor_profile_legal_name, email_address, investment_amount, shares, investment_status
      FROM old_investments
      WHERE project_id = 66198
      LIMIT 5
    `);
    console.log(sampleRows.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
