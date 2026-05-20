-- Migration: Add is_edited column to meetings table
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
