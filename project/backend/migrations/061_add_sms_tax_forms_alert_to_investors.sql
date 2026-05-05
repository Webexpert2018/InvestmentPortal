-- Migration: 061_add_sms_tax_forms_alert_to_investors.sql
-- Add notif_sms_tax_forms column to investors table

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investors' AND column_name='notif_sms_tax_forms') THEN
        ALTER TABLE investors ADD COLUMN notif_sms_tax_forms BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Migration record
INSERT INTO migrations (name) VALUES ('061_add_sms_tax_forms_alert_to_investors.sql')
ON CONFLICT (name) DO NOTHING;
