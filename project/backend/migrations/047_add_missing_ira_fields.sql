-- Migration: add missing fields to ira_accounts table (SSN and Mailing Country)
ALTER TABLE ira_accounts
ADD COLUMN IF NOT EXISTS ssn VARCHAR(20),
ADD COLUMN IF NOT EXISTS mailing_country VARCHAR(100);

-- Record this migration
INSERT INTO migrations (name) VALUES ('047_add_missing_ira_fields.sql')
ON CONFLICT (name) DO NOTHING;
