import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

import { db } from '../src/config/database';

async function listInvestors() {
  try {
    const result = await db.query('SELECT id, email, full_name, status FROM investors');
    console.log('👥 Database Investors:');
    result.rows.forEach(user => {
      console.log(`- ${user.email} (${user.full_name}, ${user.status}) ID: ${user.id}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to list investors:', error);
    process.exit(1);
  }
}

listInvestors();
