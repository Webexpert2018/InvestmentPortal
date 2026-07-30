-- Migration 083: Create doctor_prospect_notes table for doctor lead notes

CREATE TABLE IF NOT EXISTS doctor_prospect_notes (
    id SERIAL PRIMARY KEY,
    prospect_id VARCHAR(255) NOT NULL REFERENCES doctor_prospects(apollo_id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    author_name VARCHAR(255) DEFAULT 'Staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctor_prospect_notes_prospect_id ON doctor_prospect_notes(prospect_id);
