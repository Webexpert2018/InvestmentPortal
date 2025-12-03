import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function updateAdminPassword() {
  const client = await pool.connect();

  try {
    console.log('🔄 Updating admin password...');
    
    // Hash the password
    const password = 'Admin123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log(`📝 New password hash: ${hashedPassword}`);
    console.log(`🔐 Updating user: admin@bitcoinira.com`);

    // Update the password
    const result = await client.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email',
      [hashedPassword, 'admin@bitcoinira.com']
    );

    if (result.rows.length === 0) {
      console.error('❌ Admin user not found!');
      return;
    }

    console.log('✅ Password updated successfully!');
    console.log(`   User: ${result.rows[0].email}`);
    console.log(`   ID: ${result.rows[0].id}`);
    console.log('\n🎉 You can now login with:');
    console.log(`   Email: admin@bitcoinira.com`);
    console.log(`   Password: Admin123!`);

  } catch (error) {
    console.error('❌ Error updating password:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateAdminPassword().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
