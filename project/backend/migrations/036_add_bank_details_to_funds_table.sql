-- Migration: Add bank details to funds table
-- Created: 2026-04-14

ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS account_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS routing_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS beneficiary_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_address TEXT;

-- Record migration
INSERT INTO migrations (name) VALUES ('036_add_bank_details_to_funds_table.sql')
ON CONFLICT (name) DO NOTHING;
