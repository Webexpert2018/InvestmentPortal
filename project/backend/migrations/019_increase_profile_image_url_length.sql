-- Migration: Increase profile_image_url length in users table
-- Created: 2026-04-02

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='profile_image_url') THEN
        ALTER TABLE users ALTER COLUMN profile_image_url TYPE TEXT;
    END IF;
END $$;

-- Record migration
INSERT INTO migrations (name) VALUES ('019_increase_profile_image_url_length.sql')
ON CONFLICT (name) DO NOTHING;
