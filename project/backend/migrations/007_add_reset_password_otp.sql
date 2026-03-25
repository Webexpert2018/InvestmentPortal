-- Migration: Add Forgot Password OTP Support
-- Created: 2026-03-23

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6),
ADD COLUMN IF NOT EXISTS reset_otp_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookup (optional but recommended if we query by OTP)
CREATE INDEX IF NOT EXISTS idx_users_reset_otp ON users(reset_otp);

-- Record migration
INSERT INTO migrations (name) VALUES ('007_add_reset_password_otp.sql')
ON CONFLICT (name) DO NOTHING;
