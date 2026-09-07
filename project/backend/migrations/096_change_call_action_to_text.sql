-- Migration 096: Change call_action to TEXT
ALTER TABLE doctor_prospects ALTER COLUMN call_action TYPE TEXT;
