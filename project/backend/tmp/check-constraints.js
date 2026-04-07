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

    const res = await client.query(`
      SELECT 
          tc.table_schema, 
          tc.constraint_name, 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_schema AS foreign_table_schema,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND (tc.table_name='investor_profiles' OR ccu.table_name='investor_profiles');
    `);

    console.log('--- CONSTRAINTS INVOLVING investor_profiles ---');
    if (res.rows.length === 0) {
      console.log('No constraints found.');
    } else {
      res.rows.forEach(row => {
        console.log(`- ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name} (${row.constraint_name})`);
      });
    }

    client.release();
  } catch (err) {
    console.error('❌ Error checking constraints:', err.message);
  } finally {
    await pool.end();
  }
}

check();
