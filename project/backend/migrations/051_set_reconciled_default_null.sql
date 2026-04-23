-- Migration: 051_set_reconciled_default_null.sql
-- Remove DEFAULT FALSE constraint from is_reconciled column in investments and redemptions

-- Update investments table
ALTER TABLE investments 
ALTER COLUMN is_reconciled DROP DEFAULT;

-- Update redemptions table
ALTER TABLE redemptions 
ALTER COLUMN is_reconciled DROP DEFAULT;
