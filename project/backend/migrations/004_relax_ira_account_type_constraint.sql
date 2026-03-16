-- Migration: relax account_type constraint in ira_accounts

ALTER TABLE ira_accounts DROP CONSTRAINT IF EXISTS ira_accounts_account_type_check;

ALTER TABLE ira_accounts
ADD CONSTRAINT ira_accounts_account_type_check
CHECK (account_type IN ('Traditional', 'Roth', 'SEP', 'Roth SEP', 'Rollover', 'traditional', 'roth', 'sep', 'simple'));

-- Record this migration
INSERT INTO migrations (name) VALUES ('004_relax_ira_account_type_constraint.sql')
ON CONFLICT (name) DO NOTHING;
