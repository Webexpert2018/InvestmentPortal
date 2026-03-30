-- Migration: Create fund_documents table
-- Created: 2026-03-30

CREATE TABLE IF NOT EXISTS fund_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- e.g., 'K-1', 'Statement', 'Tax Form'
    tax_year INTEGER,
    description TEXT,
    note TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups by fund
CREATE INDEX IF NOT EXISTS idx_fund_documents_fund_id ON fund_documents(fund_id);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_fund_documents_updated_at ON fund_documents;
CREATE TRIGGER update_fund_documents_updated_at BEFORE UPDATE ON fund_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Record migration
INSERT INTO migrations (name) VALUES ('012_create_fund_documents.sql')
ON CONFLICT (name) DO NOTHING;
