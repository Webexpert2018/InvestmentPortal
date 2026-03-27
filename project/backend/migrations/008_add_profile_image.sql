DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='profile_image_url') THEN
        ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(255);
    END IF;
END $$;
