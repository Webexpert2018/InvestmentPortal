-- Migration: Alter fund_transfers fund IDs to VARCHAR(255)

-- Drop the strict UUID foreign key constraints
ALTER TABLE fund_transfers DROP CONSTRAINT IF EXISTS fund_transfers_from_fund_id_fkey;
ALTER TABLE fund_transfers DROP CONSTRAINT IF EXISTS fund_transfers_to_fund_id_fkey;

-- Alter the column types to VARCHAR(255) to support legacy integer IDs and text names
ALTER TABLE fund_transfers ALTER COLUMN from_fund_id TYPE VARCHAR(255);
ALTER TABLE fund_transfers ALTER COLUMN to_fund_id TYPE VARCHAR(255);

-- Record migration
INSERT INTO migrations (name) VALUES ('099_alter_fund_transfers_fund_id_types.sql')
ON CONFLICT (name) DO NOTHING;
