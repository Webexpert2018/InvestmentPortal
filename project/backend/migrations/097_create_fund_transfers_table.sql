-- Migration: Create Fund Transfers Table

CREATE TABLE IF NOT EXISTS fund_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_type VARCHAR(50) NOT NULL CHECK (transfer_type IN ('FUND_TO_FUND', 'PERSON_TO_PERSON')),
    from_investor_id UUID REFERENCES investors(id),
    to_investor_id UUID REFERENCES investors(id),
    from_fund_id UUID REFERENCES funds(id),
    to_fund_id UUID REFERENCES funds(id),
    investment_amount NUMERIC(15,2) NOT NULL,
    units NUMERIC(20,8) NOT NULL,
    document_url VARCHAR(255),
    docusign_envelope_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING_SIGNATURE' CHECK (status IN ('PENDING_SIGNATURE', 'COMPLETED', 'FAILED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fund_transfers_from_investor ON fund_transfers(from_investor_id);
CREATE INDEX IF NOT EXISTS idx_fund_transfers_to_investor ON fund_transfers(to_investor_id);
CREATE INDEX IF NOT EXISTS idx_fund_transfers_from_fund ON fund_transfers(from_fund_id);
CREATE INDEX IF NOT EXISTS idx_fund_transfers_to_fund ON fund_transfers(to_fund_id);
