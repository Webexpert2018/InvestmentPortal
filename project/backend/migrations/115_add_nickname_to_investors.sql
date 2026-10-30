-- Migration 115: Add nickname column to investors table
-- Allows admins to assign a searchable nickname to any investor

ALTER TABLE investors
  ADD COLUMN IF NOT EXISTS nickname VARCHAR(100) DEFAULT NULL;

-- Optional: index for fast nickname searches
CREATE INDEX IF NOT EXISTS idx_investors_nickname ON investors (LOWER(nickname));
