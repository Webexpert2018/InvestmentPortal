-- Migration: add kyc_status to users table
-- Created: 2026-04-07

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'pending' 
CHECK (kyc_status IN ('pending', 'approved', 'rejected'));

-- Create index for faster filtering on KYC console
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);

-- Record migration
INSERT INTO migrations (name) VALUES ('024_add_kyc_status_to_users.sql')
ON CONFLICT (name) DO NOTHING;
