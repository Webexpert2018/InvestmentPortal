const { Client } = require('pg');
require('dotenv').config();

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    console.log('Connected to DB');
    
    const result = await client.query(
      "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('investors', 'user_otps') AND column_name IN ('id', 'user_id', 'otp', 'type', 'is_used', 'expires_at')"
    );
    console.log('Schema info:', JSON.stringify(result.rows, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkSchema();
