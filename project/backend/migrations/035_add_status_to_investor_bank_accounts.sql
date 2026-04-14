-- Migration: Add status column to investor bank accounts
-- Defaults to 'active' for existing and new records.

ALTER TABLE investor_bank_accounts 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Record migration
INSERT INTO migrations (name) VALUES ('035_add_status_to_investor_bank_accounts.sql')
ON CONFLICT (name) DO NOTHING;
