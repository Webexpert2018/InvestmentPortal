const { Client } = require('pg');
require('dotenv').config();

async function getConstraintNames() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Fetching constraint names referencing USERS...');
    const res = await client.query(`
      SELECT
          tc.constraint_name, 
          tc.table_name, 
          kcu.column_name
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name='users';
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('Error fetching constraints:', err);
  } finally {
    await client.end();
  }
}

getConstraintNames();
