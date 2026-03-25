const { Client } = require('pg');
require('dotenv').config();

async function testOtpInsertion() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Find a user
    const userRes = await client.query('SELECT id, email FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      console.log('No users found');
      return;
    }
    const user = userRes.rows[0];
    console.log(`Testing for user: ${user.email} (ID: ${user.id})`);

    const otp = '999999';
    const type = 'FORGOT_PASSWORD';
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    console.log('Inserting into user_otps...');
    const insertRes = await client.query(
      'INSERT INTO user_otps (user_id, otp, type, expires_at) VALUES ($1, $2, $3, $4) RETURNING id',
      [user.id, otp, type, expiresAt]
    );
    console.log(`Success! Inserted row ID: ${insertRes.rows[0].id}`);

    const verifyRes = await client.query('SELECT * FROM user_otps WHERE id = $1', [insertRes.rows[0].id]);
    console.log('Verified row:', verifyRes.rows[0]);

  } catch (err) {
    console.error('❌ Insertion failed:', err.message);
  } finally {
    await client.end();
  }
}

testOtpInsertion();
