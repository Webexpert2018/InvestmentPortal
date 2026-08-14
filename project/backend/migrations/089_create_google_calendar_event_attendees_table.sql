-- Create google_calendar_event_attendees table to support multiple guests per sandbox meeting
CREATE TABLE IF NOT EXISTS google_calendar_event_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_event_id VARCHAR(255) REFERENCES google_calendar_events(google_event_id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'needsAction',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(google_event_id, email)
);
