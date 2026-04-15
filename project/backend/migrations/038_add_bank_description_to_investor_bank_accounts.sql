-- Migration: Add bank_description column to investor_bank_accounts table
-- This stores additional description for bank accounts (e.g., "For Further Credit To")

ALTER TABLE investor_bank_accounts 
ADD COLUMN IF NOT EXISTS bank_description TEXT;

-- Create index for better queries if needed
CREATE INDEX IF NOT EXISTS idx_investor_bank_accounts_updated_at ON investor_bank_accounts(updated_at);

-- Record migration
INSERT INTO migrations (name) VALUES ('038_add_bank_description_to_investor_bank_accounts.sql')
ON CONFLICT (name) DO NOTHING;
