-- Migration: Add subscription document fields to funds table
-- Created: 2026-05-28

ALTER TABLE funds 
ADD COLUMN IF NOT EXISTS subscription_doc_path VARCHAR(255),
ADD COLUMN IF NOT EXISTS anchor_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS anchor_date VARCHAR(100),
ADD COLUMN IF NOT EXISTS anchor_signature VARCHAR(100),
ADD COLUMN IF NOT EXISTS anchor_amount VARCHAR(100);

-- Record migration
INSERT INTO migrations (name) VALUES ('072_add_subscription_document_fields_to_funds.sql')
ON CONFLICT (name) DO NOTHING;
