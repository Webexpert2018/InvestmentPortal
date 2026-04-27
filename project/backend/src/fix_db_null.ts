
import { db } from './config/database';

async function fixProductionSchema() {
  console.log('🚀 Altering fund_documents table to allow NULL for fund_id...');
  try {
    await db.query(`ALTER TABLE fund_documents ALTER COLUMN fund_id DROP NOT NULL;`);
    console.log('✅ Successfully made fund_id nullable!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to alter table:', err);
    process.exit(1);
  }
}

fixProductionSchema();
