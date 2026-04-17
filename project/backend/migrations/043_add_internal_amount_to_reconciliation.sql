-- Migration: 043_add_internal_amount_to_reconciliation.sql
-- Add internal_amount column to investments and redemptions for reconciliation

-- Add to investments table
ALTER TABLE investments 
ADD COLUMN IF NOT EXISTS internal_amount NUMERIC(18, 2) DEFAULT 0;

-- Add to redemptions table
ALTER TABLE redemptions 
ADD COLUMN IF NOT EXISTS internal_amount NUMERIC(24, 8) DEFAULT 0;

-- Update existing records to have 0 if they don't already
UPDATE investments SET internal_amount = 0 WHERE internal_amount IS NULL;
UPDATE redemptions SET internal_amount = 0 WHERE internal_amount IS NULL;
