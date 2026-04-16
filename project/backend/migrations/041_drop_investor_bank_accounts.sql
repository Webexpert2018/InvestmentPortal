-- Migration: Drop obsolete investor_bank_accounts table
-- Data already migrated to user_bank_accounts in migration 039.
-- Code fully updated to use unified user_bank_accounts table with role field.

DROP TABLE IF EXISTS investor_bank_accounts CASCADE;

-- Record migration
INSERT INTO migrations (name) VALUES ('041_drop_investor_bank_accounts.sql')
ON CONFLICT (name) DO NOTHING;

