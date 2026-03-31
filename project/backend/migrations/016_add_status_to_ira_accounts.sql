-- Migration: 016_add_status_to_ira_accounts.sql
-- Add status column to ira_accounts with default 'Active'

ALTER TABLE ira_accounts 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';

-- Update existing records if any
UPDATE ira_accounts SET status = 'Active' WHERE status IS NULL;
