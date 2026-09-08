-- Migration: Create Fund Transfer Templates Table

CREATE TABLE IF NOT EXISTS fund_transfer_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_type VARCHAR(50) NOT NULL UNIQUE CHECK (transfer_type IN ('FUND_TO_FUND', 'PERSON_TO_PERSON')),
    document_url VARCHAR(255) NOT NULL,
    placements JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Record migration
INSERT INTO migrations (name) VALUES ('098_create_fund_transfer_templates_table.sql')
ON CONFLICT (name) DO NOTHING;
