import { db } from '../src/config/database';

async function run() {
  try {
    await db.query(`UPDATE doctor_prospects SET phone = '+1 (512) 555-0192', email = 'david.wiebe@medical-verified.org' WHERE apollo_id = '66d7f2c85b1234567890abcd'`);
    await db.query(`UPDATE doctor_prospects SET phone = '+1 (312) 555-0148', email = 'sarah.jenkins@medical-verified.org' WHERE apollo_id = '66d7f2c85b1234567890abce'`);
    await db.query(`UPDATE doctor_prospects SET phone = '+1 (305) 555-0183', email = 'marcus.vance@medical-verified.org' WHERE apollo_id = '66d7f2c85b1234567890abcf'`);
    await db.query(`UPDATE doctor_prospects SET phone = '+1 (415) 555-0129', email = 'tihevam672@luckfeed.com' WHERE apollo_id = '66d7f2c85b1234567890abd0'`);
    await db.query(`UPDATE doctor_prospects SET phone = '+1 (214) 555-0174', email = 'robert.thorne@medical-verified.org' WHERE apollo_id = '66d7f2c85b1234567890abd1'`);
    console.log('Successfully updated existing DB records with clean phone and email addresses!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
