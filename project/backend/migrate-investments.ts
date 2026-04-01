import { db } from './src/config/database';

async function migrate() {
  const query = `
    ALTER TABLE investments 
    ADD COLUMN IF NOT EXISTS awaiting_funding BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS awaiting_funding_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS funds_received BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS funds_received_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS units_issued BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS units_issued_at TIMESTAMP WITH TIME ZONE;
  `;
  
  try {
    console.log('⏳ Running migration...');
    await db.query(query);
    console.log('✅ Migration successful');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
