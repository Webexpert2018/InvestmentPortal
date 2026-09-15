-- Migration: add_document_signatures
-- Created: 2026-09-15T07:45:23.332Z

CREATE TABLE IF NOT EXISTS document_signature_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    original_document_path VARCHAR(512) NOT NULL,
    placements JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_signature_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES document_signature_campaigns(id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'PENDING',
    envelope_id VARCHAR(255),
    signed_document_path VARCHAR(512),
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, investor_id)
);

-- Don't forget to record the migration
INSERT INTO migrations (name) VALUES ('109_add_document_signatures.sql')
ON CONFLICT (name) DO NOTHING;
