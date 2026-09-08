const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function run() {
  await client.connect();
  try {
    const res = await client.query(`
      INSERT INTO old_investments (
        project_name, 
        project_id, 
        project_status,
        email_address, 
        shares, 
        investment_amount,
        investor_profile_legal_name,
        investment_ownership_id
      ) VALUES (
        'PhysicianBTC Fund', 
        999999, 
        'Investing',
        'webexpert2324@gmail.com', 
        150.5, 
        '$150,500.00',
        'Test User',
        999999
      )
    `);
    console.log('Inserted test data successfully.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}
run();
