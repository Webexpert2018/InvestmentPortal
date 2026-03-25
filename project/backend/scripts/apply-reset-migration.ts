import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

import { db } from '../src/config/database';

async function applyMigration() {
  try {
    // Check if users table exists
    const usersExist = await db.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'users'");
    if (usersExist.rows.length === 0) {
      console.error('❌ Table "users" does not exist. Please run initial setup first.');
      process.exit(1);
    }

    // Add columns if they don't exist
    console.log('🔄 Adding columns to users table...');
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6),
      ADD COLUMN IF NOT EXISTS reset_otp_expires_at TIMESTAMP WITH TIME ZONE;
    `);
    
    // Create index if it doesn't exist
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_users_reset_otp ON users(reset_otp);
    `);

    // Check if migrations table exists
    const migrationsExist = await db.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'migrations'");
    if (migrationsExist.rows.length > 0) {
      console.log('🔄 Recording migration in migrations table...');
      await db.query("INSERT INTO migrations (name) VALUES ('007_add_reset_password_otp.sql') ON CONFLICT (name) DO NOTHING");
    }

    console.log('✅ Migration applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to apply migration:', error);
    process.exit(1);
  }
}

applyMigration();
