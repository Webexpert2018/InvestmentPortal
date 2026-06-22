const { Client } = require('pg');
require('dotenv').config();

async function prepare() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    // Harry Gates original email is 'defapev931@parsitv.com'
    const res = await client.query(
      `UPDATE investors 
       SET email = 'gmarkewitz@gmail.com', 
           password_hash = '$2b$10$rJvLwPgQX5YXZ0oY5hLZOu4K8LhFGV3wF.8TJfN9vEh4MKmYhL6Py'
       WHERE email = 'defapev931@parsitv.com' OR email = 'gmarkewitz@gmail.com'
       RETURNING id, email, full_name`
    );
    console.log('Updated Investor:');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

prepare();
