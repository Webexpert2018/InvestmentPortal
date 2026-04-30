-- Migration: 057_add_tax_year_to_investor_documents.sql
-- Add tax_year column to investor_documents to support Tax Vault features.

ALTER TABLE investor_documents ADD COLUMN IF NOT EXISTS tax_year INTEGER;

-- Add index for tax_year
CREATE INDEX IF NOT EXISTS idx_investor_documents_tax_year ON investor_documents(tax_year);

-- Record migration
INSERT INTO migrations (name) VALUES ('057_add_tax_year_to_investor_documents.sql')
ON CONFLICT (name) DO NOTHING;
