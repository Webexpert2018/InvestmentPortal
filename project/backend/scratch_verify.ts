import { db } from './src/config/database';

async function checkUsers() {
  try {
    console.log('\n--- Users Table (Staff/Admins) ---');
    const users = await db.query('SELECT email, role, first_name, last_name FROM users ORDER BY created_at DESC LIMIT 5');
    console.table(users.rows);

    console.log('\n--- Investors Table ---');
    const investors = await db.query('SELECT email, role, full_name FROM investors ORDER BY created_at DESC LIMIT 5');
    console.table(investors.rows);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
