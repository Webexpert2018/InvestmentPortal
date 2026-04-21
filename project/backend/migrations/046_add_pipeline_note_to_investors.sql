-- Migration: Add Pipeline Note to Investors
ALTER TABLE investors ADD COLUMN IF NOT EXISTS pipeline_note TEXT;

-- Record migration
INSERT INTO migrations (name) VALUES ('046_add_pipeline_note_to_investors.sql')
ON CONFLICT (name) DO NOTHING;
