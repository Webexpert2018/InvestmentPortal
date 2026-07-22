-- Migration 078: Create doctor_prospects and prospect_events tables for Apollo & AI Campaign Workflow

CREATE TABLE IF NOT EXISTS doctor_prospects (
    apollo_id VARCHAR(255) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    specialty VARCHAR(255),
    organization VARCHAR(255),
    location VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(255),
    email_status VARCHAR(50) DEFAULT 'unverified',
    stage VARCHAR(50) DEFAULT 'pending_outreach',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctor_prospects_email ON doctor_prospects(email);
CREATE INDEX IF NOT EXISTS idx_doctor_prospects_stage ON doctor_prospects(stage);

CREATE TABLE IF NOT EXISTS prospect_events (
    id SERIAL PRIMARY KEY,
    prospect_id VARCHAR(255) REFERENCES doctor_prospects(apollo_id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prospect_events_prospect_id ON prospect_events(prospect_id);
