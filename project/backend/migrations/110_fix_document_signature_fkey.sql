-- Migration: fix_document_signature_fkey
-- Created: 2026-09-15

ALTER TABLE document_signature_recipients DROP CONSTRAINT IF EXISTS document_signature_recipients_investor_id_fkey;
ALTER TABLE document_signature_recipients ADD CONSTRAINT document_signature_recipients_investor_id_fkey FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE;
