-- Migration: Create User Bank Accounts Table
-- This table stores bank details for any application user (investor, admin, staff, etc.).

CREATE TABLE IF NOT EXISTS user_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'investor',
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  routing_number VARCHAR(100) NOT NULL,
  beneficiary_name VARCHAR(255) NOT NULL,
  bank_address TEXT,
  bank_description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_user_bank_accounts_user_id ON user_bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bank_accounts_role ON user_bank_accounts(role);

-- Migrate existing investor_bank_accounts rows into new table (set role = 'investor')
INSERT INTO user_bank_accounts (user_id, role, bank_name, account_number, routing_number, beneficiary_name, bank_address, bank_description, status, created_at, updated_at)
SELECT investor_id, 'investor', bank_name, account_number, routing_number, beneficiary_name, bank_address, bank_description, COALESCE(status, 'active'), created_at, updated_at
FROM investor_bank_accounts
ON CONFLICT DO NOTHING;

-- Record migration
INSERT INTO migrations (name) VALUES ('039_create_user_bank_accounts.sql')
ON CONFLICT (name) DO NOTHING;
