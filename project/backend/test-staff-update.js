
const { Client } = require('pg');
require('dotenv').config();

async function testUpdate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('--- Testing Staff Update ---');
    const res = await client.query(`
      UPDATE staff 
      SET 
        dob = '1990-01-01', 
        address_line1 = '123 Staff St', 
        city = 'Staff City', 
        state = 'SC', 
        zip_code = '12345', 
        country = 'US', 
        tax_id = '123-45-6789' 
      WHERE email = 'ben@gmail.com' 
      RETURNING *;
    `);
    
    if (res.rows.length > 0) {
      console.log('✅ Update successful:');
      console.log(JSON.stringify(res.rows[0], null, 2));
    } else {
      console.log('❌ User not found');
    }

    console.log('--- Testing getProfile logic ---');
    const profileRes = await client.query(`
        SELECT 
          id, email, role, full_name, phone, status, created_at, profile_image_url,
          dob, address_line1, address_line2, city, state, zip_code, country, tax_id
        FROM staff
        WHERE email = 'ben@gmail.com'`);
    console.log('✅ Fetch successful:');
    console.log(JSON.stringify(profileRes.rows[0], null, 2));

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
  }
}

testUpdate();
