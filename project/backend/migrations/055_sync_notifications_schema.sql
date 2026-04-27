-- Migration: 055_sync_notifications_schema.sql
-- Synchronizes the notifications table with the actual required schema found in the database.

DO $$ 
BEGIN 
    -- Add message column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='message') THEN
        ALTER TABLE notifications ADD COLUMN message TEXT;
        -- Backfill message from description
        UPDATE notifications SET message = description WHERE message IS NULL;
    END IF;

    -- Add related_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='related_id') THEN
        ALTER TABLE notifications ADD COLUMN related_id UUID DEFAULT '00000000-0000-0000-0000-000000000000';
    END IF;

    -- Add related_type column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='related_type') THEN
        ALTER TABLE notifications ADD COLUMN related_type VARCHAR(50);
        -- Backfill from type
        UPDATE notifications SET related_type = type WHERE related_type IS NULL;
    END IF;
END $$;

-- Migration record
INSERT INTO migrations (name) VALUES ('055_sync_notifications_schema.sql')
ON CONFLICT (name) DO NOTHING;
