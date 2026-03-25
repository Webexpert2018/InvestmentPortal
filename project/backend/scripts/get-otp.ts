import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

import { db } from '../src/config/database';

async function getOtp(email: string) {
  try {
    const result = await db.query(
      'SELECT reset_otp FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length > 0) {
      console.log(`OTP for ${email}: ${result.rows[0].reset_otp}`);
    } else {
      console.log(`No user found with email ${email}`);
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to retrieve OTP:', error);
    process.exit(1);
  }
}

const email = process.argv[2] || 'admin@bitcoinira.com';
getOtp(email);
