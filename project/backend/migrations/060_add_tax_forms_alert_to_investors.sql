-- Migration: 060_add_tax_forms_alert_to_investors.sql
-- Add pref_tax_forms_alert column to investors table

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='investors' AND column_name='pref_tax_forms_alert') THEN
        ALTER TABLE investors ADD COLUMN pref_tax_forms_alert BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Migration record
INSERT INTO migrations (name) VALUES ('060_add_tax_forms_alert_to_investors.sql')
ON CONFLICT (name) DO NOTHING;
