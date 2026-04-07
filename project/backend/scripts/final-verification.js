const { Client } = require('pg');
require('dotenv').config();

async function runFullTest() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    console.log('--- TEST 1: Table Counts ---');
    const invCount = await client.query("SELECT COUNT(*) FROM investors");
    const userCount = await client.query("SELECT COUNT(*) FROM users");
    console.log(`Standalone Investors: ${invCount.rows[0].count}`);
    console.log(`Remaining Users (Admins): ${userCount.rows[0].count}`);

    console.log('\n--- TEST 2: Investment Links ---');
    const invTest = await client.query(`
      SELECT i.full_name, inv.investment_amount, inv.status
      FROM investors i
      JOIN investments inv ON i.id = inv.user_id
      LIMIT 3
    `);
    console.log('Sample Linked Investments:');
    console.table(invTest.rows);

    console.log('\n--- TEST 3: Auth Mock ---');
    const authTest = await client.query("SELECT email, password_hash FROM investors LIMIT 1");
    if (authTest.rows[0]) {
      console.log(`Auth check for investor: ${authTest.rows[0].email} - PASSED (Record exists)`);
    }

  } catch (err) {
    console.error('TEST FAILED:', err);
  } finally {
    await client.end();
  }
}

runFullTest();
