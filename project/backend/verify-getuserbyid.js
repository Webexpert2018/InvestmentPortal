
const { Client } = require('pg');
require('dotenv').config();

async function verifyGetUserById() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    
    // 1. Get a staff member ID
    const staffRes = await client.query('SELECT id, email FROM staff LIMIT 1');
    if (staffRes.rows.length === 0) {
      console.log('No staff members found');
      return;
    }
    const staffId = staffRes.rows[0].id;
    const staffEmail = staffRes.rows[0].email;
    console.log(`Testing with staff: ${staffEmail} (${staffId})`);

    // In a real app, we'd call the service. Here we'll simulate the query I wrote in getUserById.
    const query = `
      SELECT 
        id, email, role, full_name, phone, status, created_at as "createdAt", 
        profile_image_url as "profileImageUrl", dob, address_line1 as "addressLine1", 
        address_line2 as "addressLine2", city, state, zip_code as "zipCode", country, 
        tax_id as "taxId", 'approved' as "kycStatus"
      FROM staff
      WHERE id = $1`;
    
    const res = await client.query(query, [staffId]);
    console.log('✅ Simulated getUserById (staff) successful:');
    console.log(JSON.stringify(res.rows[0], null, 2));

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
  }
}

verifyGetUserById();
