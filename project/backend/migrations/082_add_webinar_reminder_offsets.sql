-- Migration 082: Add reminder_offsets column to webinars table
ALTER TABLE webinars 
ADD COLUMN IF NOT EXISTS reminder_offsets INT[] DEFAULT '{}';
