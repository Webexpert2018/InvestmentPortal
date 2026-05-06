-- Migration: Remove associated_fund_id from staff table
-- Created: 2026-05-06

ALTER TABLE staff DROP COLUMN IF EXISTS associated_fund_id;

-- Record migration
INSERT INTO migrations (name) VALUES ('064_remove_associated_fund_id_from_staff.sql')
ON CONFLICT (name) DO NOTHING;
