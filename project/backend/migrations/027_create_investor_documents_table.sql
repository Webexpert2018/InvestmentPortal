-- Migration: 027_create_investor_documents_table.sql
-- Create investor_documents table for KYC, Tax, and Investment related files.

CREATE TABLE IF NOT EXISTS investor_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'kyc_id', 'kyc_tax', 'wire_proof'
    file_size BIGINT,
    description TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for investor_id
CREATE INDEX IF NOT EXISTS idx_investor_documents_investor_id ON investor_documents(investor_id);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_investor_documents_updated_at ON investor_documents;
CREATE TRIGGER update_investor_documents_updated_at BEFORE UPDATE ON investor_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Record migration
INSERT INTO migrations (name) VALUES ('027_create_investor_documents_table.sql')
ON CONFLICT (name) DO NOTHING;
