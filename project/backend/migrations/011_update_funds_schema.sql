-- Migration: Update funds table with UI-specific fields
-- Created: 2026-03-30

ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS note TEXT;

-- Update existing records if any
UPDATE funds SET start_date = created_at::DATE WHERE start_date IS NULL;
UPDATE funds SET status = 'Active' WHERE status IS NULL;

-- Record migration
INSERT INTO migrations (name) VALUES ('011_update_funds_schema.sql')
ON CONFLICT (name) DO NOTHING;
