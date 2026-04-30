import { db } from '../src/config/database';

async function checkAccountants() {
  try {
    const staffCount = await db.query("SELECT COUNT(*) FROM staff WHERE role = 'accountant'");
    console.log('Accountant count in staff:', staffCount.rows[0].count);
    
    const staffSample = await db.query("SELECT * FROM staff WHERE role = 'accountant' LIMIT 1");
    console.log('Accountant sample in staff:', staffSample.rows);
    
    const usersCount = await db.query("SELECT COUNT(*) FROM users WHERE role = 'accountant'");
    console.log('Accountant count in users:', usersCount.rows[0].count);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

checkAccountants();
