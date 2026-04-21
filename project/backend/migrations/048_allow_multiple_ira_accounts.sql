-- Migration: allow multiple IRA accounts per user
-- Drop the unique constraint on user_id in ira_accounts table

-- First, find the constraint name if it's not the default
-- In Postgres, it's typically 'ira_accounts_user_id_key'
ALTER TABLE ira_accounts DROP CONSTRAINT IF EXISTS ira_accounts_user_id_key;

-- Record this migration
INSERT INTO migrations (name) VALUES ('048_allow_multiple_ira_accounts.sql')
ON CONFLICT (name) DO NOTHING;
