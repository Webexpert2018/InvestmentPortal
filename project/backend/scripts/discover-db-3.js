const { Client } = require('pg');

async function discover() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: 'Admin@123'
  });
  try {
    console.log('Connecting with Admin@123 to default DB...');
    await client.connect();
    console.log('✅ Connected!');
    const res = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log('Databases:', res.rows.map(r => r.datname));
  } catch (err) {
    console.log('❌ Failed with Admin@123:', err.message);
  } finally {
    await client.end();
  }
}

discover();
