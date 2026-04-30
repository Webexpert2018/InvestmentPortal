import { db } from './src/config/database';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  const migrationPath = path.join(__dirname, 'migrations', '056_add_assigned_accountant_to_investors.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('🚀 Running migration 056_add_assigned_accountant_to_investors.sql...');
  
  try {
    await db.query(sql);
    console.log('✅ Migration completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

runMigration();
