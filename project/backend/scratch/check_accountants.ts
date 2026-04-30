import { db } from '../src/config/database';

async function checkAccountants() {
  try {
    const result = await db.query("SELECT * FROM staff WHERE role = 'accountant'");
    console.log('Accountants in staff table:', result.rows);
    
    const allStaff = await db.query("SELECT DISTINCT role FROM staff");
    console.log('Available roles in staff table:', allStaff.rows);
    
    const users = await db.query("SELECT * FROM users WHERE role = 'accountant'");
    console.log('Accountants in users table:', users.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

checkAccountants();
