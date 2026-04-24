
import { db } from './config/database';

async function fixFk() {
  console.log('🚀 Fixing Conversations table FK constraints...');

  try {
    // Drop the problematic FK constraint
    // First, find the constraint name
    const constraintRes = await db.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'conversations'::regclass 
      AND confrelid = 'staff'::regclass;
    `);

    if (constraintRes.rowCount && constraintRes.rowCount > 0) {
      const constraintName = constraintRes.rows[0].conname;
      console.log(`Found constraint: ${constraintName}. Dropping it...`);
      await db.query(`ALTER TABLE conversations DROP CONSTRAINT ${constraintName};`);
      console.log('✅ FK constraint to staff dropped.');
    } else {
      console.log('⚠️ No FK constraint to staff found.');
    }

    console.log('🎊 Fix complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Fix failed:', err);
    process.exit(1);
  }
}

fixFk();
