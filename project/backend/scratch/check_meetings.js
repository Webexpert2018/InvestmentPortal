const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function check() {
  await client.connect();
  console.log('Connected to DB');

  const tzCheck = await client.query(`
    SELECT 
      CURRENT_DATE,
      CURRENT_TIMESTAMP,
      DATE(CURRENT_DATE AT TIME ZONE 'UTC') as current_date_utc,
      scheduled_date,
      DATE(scheduled_date AT TIME ZONE 'UTC') as sched_date_utc
    FROM meetings 
    WHERE id = 'deab6c39-a802-4428-9d77-d2c6918e46fc'
  `);
  console.log(tzCheck.rows[0]);

  await client.end();
}

check().catch(console.error);
