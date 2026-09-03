-- Migration 086: Add call_action column to doctor_prospects table
ALTER TABLE doctor_prospects ADD COLUMN IF NOT EXISTS call_action VARCHAR(255) DEFAULT NULL;
