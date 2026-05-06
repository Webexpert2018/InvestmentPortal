const { Client } = require('pg');
require('dotenv').config();

async function checkAllUserTokens() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  const userId = '2f63381d-6fae-4394-b80b-9aa0f335c545';
  
  try {
    await client.connect();
    console.log('Connected to DB');
    
    const result = await client.query(
      "SELECT * FROM user_otps WHERE user_id = $1",
      [userId]
    );
    console.log('All tokens for user:', JSON.stringify(result.rows, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkAllUserTokens();
