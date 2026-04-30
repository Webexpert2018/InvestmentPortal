import { db } from './config/database';

async function run() {
  try {
    console.log('Adding assigned_accountant_id to investors table...');
    await db.query(`
      ALTER TABLE investors 
      ADD COLUMN IF NOT EXISTS assigned_accountant_id uuid REFERENCES staff(id);
    `);
    console.log('Column added successfully.');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

run();
