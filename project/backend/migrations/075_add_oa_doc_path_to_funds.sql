-- Migration: Add Operating Agreement document field to funds table
-- Created: 2026-06-02

ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS oa_doc_path VARCHAR(255);

-- Record migration
INSERT INTO migrations (name) VALUES ('075_add_oa_doc_path_to_funds.sql')
ON CONFLICT (name) DO NOTHING;
