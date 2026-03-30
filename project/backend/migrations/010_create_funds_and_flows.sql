-- Migration: Create funds and fund_flows tables
-- Created: 2026-03-30

-- Funds table
CREATE TABLE IF NOT EXISTS funds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    min_investment DECIMAL(18, 2) DEFAULT 0,
    unit_price DECIMAL(18, 2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fund Flows (Investment tracking) table
CREATE TABLE IF NOT EXISTS fund_flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    account_id VARCHAR(100), -- Can be 'personal', 'ira', etc.
    amount DECIMAL(18, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Subscription Submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_funds_updated_at ON funds;
CREATE TRIGGER update_funds_updated_at BEFORE UPDATE ON funds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fund_flows_updated_at ON fund_flows;
CREATE TRIGGER update_fund_flows_updated_at BEFORE UPDATE ON fund_flows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial funds (matching the ones currently static in frontend)
INSERT INTO funds (name, description, image_url, min_investment, unit_price)
VALUES 
('Strive Enterprise Fund', 'Enterprise-grade investment fund focusing on Bitcoin strategies.', '/images/strive_funds.jpg', 10000.00, 1.25),
('PhysicianBTC Fund', 'Optimized for tax-advantaged accounts of medical professionals.', '/images/strive_funds.jpg', 10000.00, 1.25)
ON CONFLICT DO NOTHING;

-- Record migration
INSERT INTO migrations (name) VALUES ('010_create_funds_and_flows.sql')
ON CONFLICT (name) DO NOTHING;
