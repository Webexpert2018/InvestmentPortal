const { Client } = require('pg');
require('dotenv').config();

async function checkExactQuery() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  const token = '141502c706809179061de586ae78bec405c03317cdcbb2bf5c6a6517ce5a0a68';
  
  try {
    await client.connect();
    console.log('Connected to DB');
    
    const query = `
      SELECT i.id, i.email, i.full_name, i.phone, i.status, i.dob, i.address_line1, i.address_line2, i.city, i.state, i.zip_code, i.country, i.tax_id 
      FROM investors i
      JOIN user_otps o ON i.id = o.user_id
      WHERE o.otp = $1 AND o.type = 'INVITATION' AND o.expires_at > NOW() AND o.is_used = false
    `;
    
    const result = await client.query(query, [token]);
    console.log('Query result rows:', result.rows.length);
    console.log('Query result:', JSON.stringify(result.rows, null, 2));

    if (result.rows.length === 0) {
      console.log('--- Debugging why it failed ---');
      const tokenExists = await client.query("SELECT * FROM user_otps WHERE otp = $1", [token]);
      console.log('Token exists in user_otps:', tokenExists.rows.length);
      if (tokenExists.rows.length > 0) {
        const t = tokenExists.rows[0];
        console.log('Token details:', {
          type: t.type,
          is_used: t.is_used,
          expires_at: t.expires_at,
          user_id: t.user_id
        });
        const now = await client.query("SELECT NOW()");
        console.log('DB NOW():', now.rows[0].now);
        
        const investorExists = await client.query("SELECT * FROM investors WHERE id = $1", [t.user_id]);
        console.log('Investor exists with that user_id:', investorExists.rows.length);
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkExactQuery();
