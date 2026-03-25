import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

import { db } from '../src/config/database';

async function listUsers() {
  try {
    const result = await db.query('SELECT id, email, role, status FROM users');
    console.log('👥 Database Users:');
    result.rows.forEach(user => {
      console.log(`- ${user.email} (${user.role}, ${user.status})`);
    });
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to list users:', error);
    process.exit(1);
  }
}

listUsers();
