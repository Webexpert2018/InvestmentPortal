-- Migration: 032_add_revised_amount_to_investments.sql
-- Description: Add revised_amount column to track current investment value based on NAV.
-- Created: 2026-04-09

-- 1. Add revised_amount column
ALTER TABLE investments ADD COLUMN revised_amount NUMERIC(18, 2);

-- 2. Initialize revised_amount for existing records
-- We use the latest active NAV to calculate the current value for all existing investments.
UPDATE investments SET revised_amount = ROUND(estimated_units * (
    SELECT nav_per_unit FROM fund_nav_history 
    WHERE status = 'active' 
    ORDER BY effective_date DESC 
    LIMIT 1
), 2);

-- If no active NAV was found (e.g., fresh DB), initialize to investment_amount as a fallback
UPDATE investments SET revised_amount = investment_amount WHERE revised_amount IS NULL;

-- 3. Mark the column as NOT NULL after initialization
ALTER TABLE investments ALTER COLUMN revised_amount SET NOT NULL;

-- Record migration
INSERT INTO migrations (name) VALUES ('032_add_revised_amount_to_investments.sql')
ON CONFLICT (name) DO NOTHING;
