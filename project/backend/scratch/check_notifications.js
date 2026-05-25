const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Spadez%40123@127.0.0.1:5432/bitcoin_ira?sslmode=disable'
});

async function check() {
  await client.connect();
  console.log('Connected to database.');

  const userId = '7d76ee60-d2fa-48ef-be80-5a3d4f8de925';
  const role = 'executive_admin';

  console.log('Marking all notifications as read for Alen Walker...');
  const result = await client.query(
    `UPDATE notifications
     SET is_read = TRUE, updated_at = NOW()
     WHERE is_read = FALSE AND (user_id = $1 OR target_role = $2)
     RETURNING id`,
    [userId, role]
  );
  console.log(`Successfully marked ${result.rows.length} notifications as read.`);

  await client.end();
}

check().catch(console.error);
