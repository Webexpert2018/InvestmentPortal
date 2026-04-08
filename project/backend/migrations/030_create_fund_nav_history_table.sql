-- Migration: Create Fund NAV History Table
-- Created: 2026-04-08

CREATE TABLE IF NOT EXISTS fund_nav_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    effective_date DATE NOT NULL,
    total_fund_value DECIMAL(18, 2) NOT NULL,
    total_units DECIMAL(18, 2) NOT NULL,
    nav_per_unit DECIMAL(18, 2) NOT NULL,
    note TEXT,
    status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- Add index for status and effective_date
CREATE INDEX IF NOT EXISTS idx_fund_nav_status ON fund_nav_history(status);
CREATE INDEX IF NOT EXISTS idx_fund_nav_effective_date ON fund_nav_history(effective_date DESC);

-- Record migration
INSERT INTO migrations (name) VALUES ('030_create_fund_nav_history_table.sql')
ON CONFLICT (name) DO NOTHING;
