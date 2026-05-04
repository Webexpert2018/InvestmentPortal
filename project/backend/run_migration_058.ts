import { db } from './src/config/database';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, 'migrations', '058_make_ira_fields_nullable.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Running migration: 058_make_ira_fields_nullable.sql');
    await db.query(sql);
    console.log('✅ Migration successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
