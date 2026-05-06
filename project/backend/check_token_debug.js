const { Client } = require('pg');
require('dotenv').config();

async function checkToken() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  const token = '141502c706809179061de586ae78bec405c03317cdcbb2bf5c6a6517ce5a0a68';
  
  try {
    await client.connect();
    console.log('Connected to DB');
    
    const result = await client.query(
      "SELECT * FROM user_otps WHERE otp = $1",
      [token]
    );
    console.log('Token search result:', JSON.stringify(result.rows, null, 2));
    
    const invitationTokens = await client.query(
      "SELECT otp, type, is_used, expires_at, (expires_at > NOW()) as is_active FROM user_otps WHERE type = 'INVITATION' ORDER BY created_at DESC LIMIT 5"
    );
    console.log('Recent INVITATION tokens:', JSON.stringify(invitationTokens.rows, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkToken();
