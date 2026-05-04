-- Migration: 058_add_notification_settings_columns.sql
-- Add notification preference columns to users, staff, and investors tables

DO $$ 
BEGIN 
    -- 1. Update users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='notif_doc_uploaded') THEN
        ALTER TABLE users ADD COLUMN notif_doc_uploaded BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='notif_missing_doc') THEN
        ALTER TABLE users ADD COLUMN notif_missing_doc BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='notif_investor_msg') THEN
        ALTER TABLE users ADD COLUMN notif_investor_msg BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='notif_reminder') THEN
        ALTER TABLE users ADD COLUMN notif_reminder BOOLEAN DEFAULT TRUE;
    END IF;

    -- 2. Update staff table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff' AND column_name='notif_doc_uploaded') THEN
        ALTER TABLE staff ADD COLUMN notif_doc_uploaded BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff' AND column_name='notif_missing_doc') THEN
        ALTER TABLE staff ADD COLUMN notif_missing_doc BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff' AND column_name='notif_investor_msg') THEN
        ALTER TABLE staff ADD COLUMN notif_investor_msg BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='staff' AND column_name='notif_reminder') THEN
        ALTER TABLE staff ADD COLUMN notif_reminder BOOLEAN DEFAULT TRUE;
    END IF;

    -- 3. Update investors table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investors' AND column_name='notif_doc_uploaded') THEN
        ALTER TABLE investors ADD COLUMN notif_doc_uploaded BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investors' AND column_name='notif_missing_doc') THEN
        ALTER TABLE investors ADD COLUMN notif_missing_doc BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investors' AND column_name='notif_investor_msg') THEN
        ALTER TABLE investors ADD COLUMN notif_investor_msg BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investors' AND column_name='notif_reminder') THEN
        ALTER TABLE investors ADD COLUMN notif_reminder BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Migration record
INSERT INTO migrations (name) VALUES ('058_add_notification_settings_columns.sql')
ON CONFLICT (name) DO NOTHING;
