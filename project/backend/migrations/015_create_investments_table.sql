-- Migration: 015_create_investments_table.sql
-- Create investments table to track the investment flow

CREATE TABLE IF NOT EXISTS investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    account_id UUID REFERENCES ira_accounts(id) ON DELETE SET NULL,
    account_type VARCHAR(50) NOT NULL, -- 'personal', 'ira'
    investment_amount NUMERIC(18, 2) NOT NULL,
    processing_fee NUMERIC(18, 2) NOT NULL,
    total_amount NUMERIC(18, 2) NOT NULL,
    unit_price NUMERIC(18, 2) NOT NULL,
    estimated_units NUMERIC(18, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Subscription Submitted',
    document_signed BOOLEAN NOT NULL DEFAULT FALSE,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_fund_id ON investments(fund_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_investments_updated_at
BEFORE UPDATE ON investments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
