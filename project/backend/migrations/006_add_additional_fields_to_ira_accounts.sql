-- Migration: add additional fields to ira_accounts table

ALTER TABLE ira_accounts
ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS suffix VARCHAR(50),
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS mailing_address_same BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS mailing_address_1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS mailing_address_2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS mailing_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS mailing_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS mailing_zip_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS username VARCHAR(100),
ADD COLUMN IF NOT EXISTS referral_source VARCHAR(255);

-- Record this migration
INSERT INTO migrations (name) VALUES ('006_add_additional_fields_to_ira_accounts.sql')
ON CONFLICT (name) DO NOTHING;
