const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function check() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    const res = await client.query('SELECT id, file_name, file_url, document_type FROM investor_documents LIMIT 5');

    console.log('--- STORED DOCUMENTS ---');
    if (res.rows.length === 0) {
      console.log('No documents found.');
    } else {
      res.rows.forEach(row => {
        console.log(`ID: ${row.id}`);
        console.log(`Name: ${row.file_name}`);
        console.log(`URL: ${row.file_url}`);
        console.log(`Type: ${row.document_type}`);
        console.log('------------------------');
      });
    }

    client.release();
  } catch (err) {
    console.error('❌ Error fetching data:', err.message);
  } finally {
    await pool.end();
  }
}

check();
