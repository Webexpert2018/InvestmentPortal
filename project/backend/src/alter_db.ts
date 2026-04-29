import { db } from './config/database';

async function run() {
  try {
    console.log('Altering table conversations...');
    await db.query('ALTER TABLE conversations ALTER COLUMN investor_id DROP NOT NULL');
    await db.query('ALTER TABLE conversations ALTER COLUMN staff_id DROP NOT NULL');
    console.log('Success!');
    process.exit(0);
  } catch (e) {
    console.error('Error altering table:', e);
    process.exit(1);
  }
}

run();
