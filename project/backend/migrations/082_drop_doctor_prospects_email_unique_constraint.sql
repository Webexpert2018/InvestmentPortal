-- Migration 082: Drop unique constraint on email in doctor_prospects table
-- Allows multiple testing doctor records to use the same test email address without constraint errors.

ALTER TABLE doctor_prospects DROP CONSTRAINT IF EXISTS doctor_prospects_email_key;
DROP INDEX IF EXISTS doctor_prospects_email_key;
