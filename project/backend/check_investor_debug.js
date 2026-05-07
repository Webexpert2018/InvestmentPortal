const { Client } = require('pg');
require('dotenv').config();

async function checkInvestor() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  const userId = '2f63381d-6fae-4394-b80b-9aa0f335c545';
  
  try {
    await client.connect();
    console.log('Connected to DB');
    
    const result = await client.query(
      "SELECT id, email, full_name, status FROM investors WHERE id = $1",
      [userId]
    );
    console.log('Investor search result:', JSON.stringify(result.rows, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkInvestor();
