
import { db } from './config/database';

async function migrateReactions() {
  console.log('🚀 Adding reactions column to messages table...');

  try {
    const cols = await db.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'messages'
    `);
    const existingCols = cols.rows.map(r => r.column_name);

    if (!existingCols.includes('reactions')) {
      await db.query(`ALTER TABLE messages ADD COLUMN reactions JSONB DEFAULT '{}';`);
      console.log('✅ Added reactions column to messages.');
    } else {
      console.log('ℹ️ Reactions column already exists.');
    }

    console.log('🎊 Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrateReactions();
