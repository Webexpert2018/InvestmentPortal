CREATE TABLE IF NOT EXISTS ringcentral_call_transcripts (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    transcription_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);



CREATE TRIGGER update_ringcentral_call_transcripts_updated_at
    BEFORE UPDATE ON ringcentral_call_transcripts
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
