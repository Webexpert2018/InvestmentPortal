DROP TABLE IF EXISTS ringcentral_call_logs CASCADE;
DROP TABLE IF EXISTS ringcentral_call_transcripts CASCADE;
DROP TRIGGER IF EXISTS update_ringcentral_call_logs_updated_at ON ringcentral_call_logs;

CREATE TABLE IF NOT EXISTS ringcentral_call_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sip_session_id VARCHAR(255),
    api_session_id VARCHAR(255) UNIQUE,
    apollo_id VARCHAR(255),
    phone_number VARCHAR(255),
    duration INTEGER,
    transcription_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_ringcentral_call_logs_updated_at
    BEFORE UPDATE ON ringcentral_call_logs
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
