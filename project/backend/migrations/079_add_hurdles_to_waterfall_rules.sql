-- Add hurdles column to waterfall_rules for Splits with Hurdles template
ALTER TABLE waterfall_rules ADD COLUMN IF NOT EXISTS hurdles JSONB DEFAULT '[]'::jsonb;
