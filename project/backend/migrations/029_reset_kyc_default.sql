-- Migration: 029_reset_kyc_default.sql
-- Resets the status for testing and fixes the default for future signups.

-- 1. Reset James Potter (for immediate testing)
UPDATE investors SET kyc_status = 'unverified' WHERE email = 'defapev931@parsitv.com';

-- 2. Update default for all new signups
ALTER TABLE investors ALTER COLUMN kyc_status SET DEFAULT 'unverified';

-- Record migration
INSERT INTO migrations (name) VALUES ('029_reset_kyc_default.sql')
ON CONFLICT (name) DO NOTHING;
