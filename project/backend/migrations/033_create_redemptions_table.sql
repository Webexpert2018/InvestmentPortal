-- -- Migration: 033_create_redemptions_table.sql
-- -- Create redemptions table to track withdrawal requests from investors

-- CREATE TABLE IF NOT EXISTS redemptions (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
--     amount NUMERIC(24, 8) NOT NULL,
--     units NUMERIC(24, 8) NOT NULL,
--     status VARCHAR(50) NOT NULL DEFAULT 'Pending',
--     reason TEXT,
--     bank_info JSONB,
--     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Index for performance
-- CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON redemptions(user_id);
-- CREATE INDEX IF NOT EXISTS idx_redemptions_investment_id ON redemptions(investment_id);
-- CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);

-- -- Trigger for updated_at
-- CREATE OR REPLACE TRIGGER update_redemptions_updated_at
-- BEFORE UPDATE ON redemptions
-- FOR EACH ROW
-- EXECUTE FUNCTION update_updated_at_column();



-- Migration: 033_create_redemptions_table.sql
-- Create redemptions table to track withdrawal requests from investors

CREATE TABLE IF NOT EXISTS redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
    investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    amount NUMERIC(24, 8) NOT NULL,
    units NUMERIC(24, 8) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    reason TEXT,
    bank_info JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_redemptions_investor_id ON redemptions(investor_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_investment_id ON redemptions(investment_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_redemptions_updated_at
BEFORE UPDATE ON redemptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
