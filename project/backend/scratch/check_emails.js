const { Client } = require('pg');
require('dotenv').config();

async function checkEmails() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query('SELECT DISTINCT email_address FROM old_investments LIMIT 10');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkEmails();
