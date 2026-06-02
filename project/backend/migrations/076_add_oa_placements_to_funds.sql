-- Migration: add OA placement columns to funds
ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS oa_placements JSONB,
ADD COLUMN IF NOT EXISTS oa_name_page INT,
ADD COLUMN IF NOT EXISTS oa_name_x INT,
ADD COLUMN IF NOT EXISTS oa_name_y INT,
ADD COLUMN IF NOT EXISTS oa_date_page INT,
ADD COLUMN IF NOT EXISTS oa_date_x INT,
ADD COLUMN IF NOT EXISTS oa_date_y INT,
ADD COLUMN IF NOT EXISTS oa_signature_page INT,
ADD COLUMN IF NOT EXISTS oa_signature_x INT,
ADD COLUMN IF NOT EXISTS oa_signature_y INT,
ADD COLUMN IF NOT EXISTS oa_amount_page INT,
ADD COLUMN IF NOT EXISTS oa_amount_x INT,
ADD COLUMN IF NOT EXISTS oa_amount_y INT;

INSERT INTO migrations (name) VALUES ('076_add_oa_placements_to_funds.sql');
