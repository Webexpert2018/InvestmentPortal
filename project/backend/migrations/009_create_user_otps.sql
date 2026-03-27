-- Migration: Create user_otps table for reusable OTP support
-- Created: 2026-03-24

-- Using SERIAL for id and UUID for user_id to match users table
CREATE TABLE IF NOT EXISTS user_otps (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp VARCHAR(6) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('FORGOT_PASSWORD', '2FA')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_otps_user_id ON user_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_otps_otp ON user_otps(otp);

-- Record migration (if migrations table exists, but creating it if not)
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migration tracking is now handled by the run-migrations.ts script
