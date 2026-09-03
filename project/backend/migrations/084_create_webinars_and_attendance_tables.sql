-- Migration 084: Create webinars, webinar_attendees, and webinar_attendance_sessions tables

CREATE TABLE IF NOT EXISTS webinars (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    webinar_date DATE NOT NULL,
    webinar_time VARCHAR(100) DEFAULT '04:00 PM EST',
    duration VARCHAR(50) DEFAULT '45 mins',
    meeting_link TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'upcoming',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webinars_date ON webinars(webinar_date);

CREATE TABLE IF NOT EXISTS webinar_attendees (
    id SERIAL PRIMARY KEY,
    webinar_id VARCHAR(255) NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
    prospect_id VARCHAR(255) NOT NULL REFERENCES doctor_prospects(apollo_id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'registered',
    first_joined_at TIMESTAMP WITH TIME ZONE,
    total_duration_minutes INT DEFAULT 0,
    join_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_webinar_prospect UNIQUE (webinar_id, prospect_id)
);

CREATE INDEX IF NOT EXISTS idx_webinar_attendees_webinar ON webinar_attendees(webinar_id);
CREATE INDEX IF NOT EXISTS idx_webinar_attendees_prospect ON webinar_attendees(prospect_id);

CREATE TABLE IF NOT EXISTS webinar_attendance_sessions (
    id SERIAL PRIMARY KEY,
    webinar_id VARCHAR(255) NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
    prospect_id VARCHAR(255) NOT NULL REFERENCES doctor_prospects(apollo_id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_webinar_sessions_prospect ON webinar_attendance_sessions(prospect_id);
