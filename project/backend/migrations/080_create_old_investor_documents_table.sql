-- Migration: 080_create_old_investor_documents_table.sql
-- Dedicated table for legacy investor documents

CREATE TABLE IF NOT EXISTS old_investor_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_profile_id INTEGER,
    investor_profile_legal_name VARCHAR(255),
    email_address VARCHAR(255),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    s3_key TEXT,
    document_type VARCHAR(100) DEFAULT 'Tax Documents',
    tax_year INTEGER,
    entity_name VARCHAR(255),
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_old_investor_docs_profile_id ON old_investor_documents(investor_profile_id);
CREATE INDEX IF NOT EXISTS idx_old_investor_docs_email ON old_investor_documents(email_address);
CREATE INDEX IF NOT EXISTS idx_old_investor_docs_legal_name ON old_investor_documents(investor_profile_legal_name);

INSERT INTO migrations (name) VALUES ('080_create_old_investor_documents_table.sql')
ON CONFLICT (name) DO NOTHING;
