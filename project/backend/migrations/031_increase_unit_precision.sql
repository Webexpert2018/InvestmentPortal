-- Migration: 031_increase_unit_precision.sql
-- Description: Increase decimal precision for fund units and NAV tracking to prevent rounding discrepancies.
-- Created: 2026-04-09

-- 1. Increase precision for investments table
ALTER TABLE investments 
    ALTER COLUMN estimated_units TYPE NUMERIC(24, 8),
    ALTER COLUMN unit_price TYPE NUMERIC(24, 8);

-- 2. Increase precision for fund_nav_history table
ALTER TABLE fund_nav_history
    ALTER COLUMN total_units TYPE NUMERIC(24, 8),
    ALTER COLUMN nav_per_unit TYPE NUMERIC(24, 8),
    ALTER COLUMN total_fund_value TYPE NUMERIC(24, 8);

-- Record migration
INSERT INTO migrations (name) VALUES ('031_increase_unit_precision.sql')
ON CONFLICT (name) DO NOTHING;
