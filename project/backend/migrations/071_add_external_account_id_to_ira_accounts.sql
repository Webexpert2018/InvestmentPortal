-- Migration: Add external_account_id to ira_accounts table
-- Created: 2026-05-26

ALTER TABLE ira_accounts ADD COLUMN IF NOT EXISTS external_account_id VARCHAR(255);

-- Record this migration
INSERT INTO migrations (name) VALUES ('071_add_external_account_id_to_ira_accounts.sql')
ON CONFLICT (name) DO NOTHING;
