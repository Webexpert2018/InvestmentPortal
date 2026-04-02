-- Migration: Add file_size to fund_documents
-- Created: 2026-04-02

ALTER TABLE fund_documents ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Record migration
INSERT INTO migrations (name) VALUES ('020_add_file_size_to_fund_documents.sql')
ON CONFLICT (name) DO NOTHING;
