-- Migration 081: Add ai_sequence column to doctor_prospects table for storing 5-day email campaign sequences

ALTER TABLE doctor_prospects 
ADD COLUMN IF NOT EXISTS ai_sequence JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN doctor_prospects.ai_sequence IS 'Stores the generated or customized 5-day AI email drip sequence JSON array for each doctor';
