const { Client } = require('pg');
require('dotenv').config();

async function checkUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('--- users table ---');
    const resUsers = await client.query('SELECT id, email, role, first_name, last_name, status FROM users');
    console.table(resUsers.rows);

    console.log('--- staff table ---');
    const resStaff = await client.query('SELECT id, email, role, full_name, status FROM staff');
    console.table(resStaff.rows);

    console.log('--- investors table ---');
    const resInv = await client.query('SELECT id, email, role, full_name, status FROM investors LIMIT 5');
    console.table(resInv.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkUsers();
