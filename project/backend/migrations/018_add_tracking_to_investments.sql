-- Migration: 018_add_tracking_to_investments.sql
-- Add lifecycle tracking columns to the investments table

ALTER TABLE investments 
ADD COLUMN IF NOT EXISTS awaiting_funding BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS funds_received BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS units_issued BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS awaiting_funding_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS funds_received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS units_issued_at TIMESTAMPTZ;

-- Record migration
INSERT INTO migrations (name) VALUES ('018_add_tracking_to_investments.sql')
ON CONFLICT (name) DO NOTHING;
