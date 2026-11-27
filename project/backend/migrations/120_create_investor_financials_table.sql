-- Create investor_financials table for storing extra financial discovery info for potential investors
CREATE TABLE IF NOT EXISTS investor_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    email VARCHAR(255),
    investor_id UUID REFERENCES investors(id) ON DELETE SET NULL,
    income NUMERIC(15, 2) DEFAULT 0,
    expenses NUMERIC(15, 2) DEFAULT 0,
    liability NUMERIC(15, 2) DEFAULT 0,
    assets NUMERIC(15, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investor_financials_created_at ON investor_financials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_investor_financials_investor_id ON investor_financials(investor_id);
