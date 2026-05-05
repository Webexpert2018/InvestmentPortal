-- Migration: Add 2FA columns to all user-related tables
-- Created: 2026-05-05

-- Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_recovery_codes TEXT[];

-- Add columns to investors table
ALTER TABLE investors ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS two_factor_recovery_codes TEXT[];

-- Add columns to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS two_factor_recovery_codes TEXT[];
