-- Migration: Add created_by fields to investors table
ALTER TABLE investors ADD COLUMN IF NOT EXISTS created_by_id UUID;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255);
