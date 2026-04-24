
import { db } from './config/database';

async function migrate() {
  console.log('🚀 Starting Messaging Module Migration...');

  try {
    // 1. Create Conversations Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
        admin_id UUID REFERENCES staff(id) ON DELETE SET NULL,
        last_message TEXT,
        last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        unread_count_investor INT DEFAULT 0,
        unread_count_admin INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Conversations table created.');

    // 2. Add conversation_id and file_url to messages
    // Check if columns exist first to avoid errors
    const cols = await db.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'messages'
    `);
    const existingCols = cols.rows.map(r => r.column_name);

    if (!existingCols.includes('conversation_id')) {
      await db.query(`ALTER TABLE messages ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;`);
      console.log('✅ Added conversation_id to messages.');
    }

    if (!existingCols.includes('file_url')) {
      await db.query(`ALTER TABLE messages ADD COLUMN file_url TEXT;`);
      console.log('✅ Added file_url to messages.');
    }

    if (!existingCols.includes('file_name')) {
      await db.query(`ALTER TABLE messages ADD COLUMN file_name TEXT;`);
      console.log('✅ Added file_name to messages.');
    }

    if (!existingCols.includes('file_size')) {
      await db.query(`ALTER TABLE messages ADD COLUMN file_size TEXT;`);
      console.log('✅ Added file_size to messages.');
    }

    console.log('🎊 Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
