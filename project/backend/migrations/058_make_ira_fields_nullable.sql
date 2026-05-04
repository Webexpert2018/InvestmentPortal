-- Migration: make account_number and custodian_name nullable in ira_accounts
ALTER TABLE ira_accounts ALTER COLUMN account_number DROP NOT NULL;
ALTER TABLE ira_accounts ALTER COLUMN custodian_name DROP NOT NULL;

-- Record this migration
INSERT INTO migrations (name) VALUES ('058_make_ira_fields_nullable.sql')
ON CONFLICT (name) DO NOTHING;
