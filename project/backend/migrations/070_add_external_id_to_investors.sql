-- Migration: Add external_id to investors table
ALTER TABLE investors ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);
