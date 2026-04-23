const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function checkUserKyc() {
  const email = 'pakofa3393@hacknapp.com';
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rowCount === 0) {
      console.log(`❌ User with email ${email} not found.`);
      // List all users to see what's there
      const allUsers = await pool.query('SELECT id, email, role FROM users');
      console.log('All Users in DB:');
      allUsers.rows.forEach(u => console.log(`- ${u.email} (${u.role})`));
      return;
    }
    const user = userRes.rows[0];
    console.log(`✅ Found User: ${user.id} (${user.first_name} ${user.last_name})`);
    
    const docsRes = await pool.query('SELECT * FROM investor_documents WHERE investor_id = $1', [user.id]);
    console.log(`Found ${docsRes.rowCount} documents for investor:`);
    docsRes.rows.forEach(d => {
      console.log(`- Name: ${d.file_name}, Type: ${d.document_type}, URL: ${d.file_url}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserKyc();
