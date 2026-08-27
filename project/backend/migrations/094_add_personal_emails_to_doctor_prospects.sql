-- Migration 094: Add personal_emails array to doctor_prospects
ALTER TABLE doctor_prospects ADD COLUMN IF NOT EXISTS personal_emails TEXT[] DEFAULT '{}';
