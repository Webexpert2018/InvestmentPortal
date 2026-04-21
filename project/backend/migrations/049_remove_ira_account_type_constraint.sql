-- Migration: remove account_type check constraint from ira_accounts
-- This allows any account type defined in the ira_account_types table

ALTER TABLE ira_accounts DROP CONSTRAINT IF EXISTS ira_accounts_account_type_check;

-- Record this migration
INSERT INTO migrations (name) VALUES ('049_remove_ira_account_type_constraint.sql')
ON CONFLICT (name) DO NOTHING;
