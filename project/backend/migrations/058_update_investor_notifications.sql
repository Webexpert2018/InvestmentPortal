-- Update investors table with new notification columns
DO $$ 
BEGIN 
    -- New Email Notifications
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investors' AND column_name='notif_alerts') THEN
        ALTER TABLE investors ADD COLUMN notif_alerts BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investors' AND column_name='notif_nav_recalc') THEN
        ALTER TABLE investors ADD COLUMN notif_nav_recalc BOOLEAN DEFAULT TRUE;
    END IF;

    -- New SMS Notifications
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investors' AND column_name='notif_sms_announcements') THEN
        ALTER TABLE investors ADD COLUMN notif_sms_announcements BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investors' AND column_name='notif_sms_alerts') THEN
        ALTER TABLE investors ADD COLUMN notif_sms_alerts BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investors' AND column_name='notif_sms_doc_uploads') THEN
        ALTER TABLE investors ADD COLUMN notif_sms_doc_uploads BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investors' AND column_name='notif_sms_nav_recalc') THEN
        ALTER TABLE investors ADD COLUMN notif_sms_nav_recalc BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investors' AND column_name='notif_sms_funding_conf') THEN
        ALTER TABLE investors ADD COLUMN notif_sms_funding_conf BOOLEAN DEFAULT TRUE;
    END IF;

END $$;
