const { Client } = require('pg');
require('dotenv').config();

async function findMatches() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const query = `
      SELECT i.email, i.full_name, COUNT(oi.investment_ownership_id) as old_investments_count
      FROM investors i
      JOIN old_investments oi ON LOWER(i.email) = LOWER(oi.email_address)
      GROUP BY i.email, i.full_name
    `;
    const res = await client.query(query);
    console.log('--- Matching Active Investors with Old Investments ---');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

findMatches();
