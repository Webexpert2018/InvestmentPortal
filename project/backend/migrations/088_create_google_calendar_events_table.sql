-- Create google_calendar_events table to store sandbox events separately from main meetings
CREATE TABLE IF NOT EXISTS google_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_email VARCHAR(255) NOT NULL,
    google_event_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    meeting_link VARCHAR(255),
    html_link VARCHAR(255),
    attendee_email VARCHAR(255) NOT NULL,
    attendee_status VARCHAR(50) DEFAULT 'needsAction',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
