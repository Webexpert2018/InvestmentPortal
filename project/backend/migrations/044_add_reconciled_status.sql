-- Migration: 044_add_reconciled_status.sql
-- Add is_reconciled column to investments and redemptions

-- Add to investments table
ALTER TABLE investments 
ADD COLUMN IF NOT EXISTS is_reconciled BOOLEAN DEFAULT FALSE;

-- Add to redemptions table
ALTER TABLE redemptions 
ADD COLUMN IF NOT EXISTS is_reconciled BOOLEAN DEFAULT FALSE;

-- Update existing records to FALSE if NULL
UPDATE investments SET is_reconciled = FALSE WHERE is_reconciled IS NULL;
UPDATE redemptions SET is_reconciled = FALSE WHERE is_reconciled IS NULL;
