-- Migration: add beneficiary to ira_accounts table

ALTER TABLE ira_accounts
ADD COLUMN IF NOT EXISTS beneficiary VARCHAR(255);

-- Record this migration
INSERT INTO migrations (name) VALUES ('003_add_beneficiary_to_ira_accounts.sql')
ON CONFLICT (name) DO NOTHING;
