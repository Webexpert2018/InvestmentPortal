-- Migration: 028_fix_investors_id_default.sql
-- Fixes the null value error on signup by adding a default UUID generator to the id column.

ALTER TABLE investors ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Record migration
INSERT INTO migrations (name) VALUES ('028_fix_investors_id_default.sql')
ON CONFLICT (name) DO NOTHING;
