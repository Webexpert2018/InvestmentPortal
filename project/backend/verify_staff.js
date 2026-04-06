const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira' });
client.connect().then(async () => {
  const result = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'staff'");
  console.log('Columns in staff table:', result.rows.map(c => c.column_name));
  process.exit(0);
});
