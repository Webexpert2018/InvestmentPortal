-- Migration: Add expected_future_investment to investors table
-- Tracks administrative projections for future investment amounts

ALTER TABLE investors ADD COLUMN IF NOT EXISTS expected_future_investment NUMERIC DEFAULT 0;

-- Record migration
INSERT INTO migrations (name) VALUES ('045_add_expected_future_investment.sql')
ON CONFLICT (name) DO NOTHING;
