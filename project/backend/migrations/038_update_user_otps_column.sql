-- Migration: Update user_otps table for full token support
-- Created: 2026-04-15

-- Expand the otp column to support long invitation tokens
ALTER TABLE user_otps ALTER COLUMN otp TYPE VARCHAR(255);

-- Remove the strict check constraint on the type column to allow INVITATION tokens
ALTER TABLE user_otps DROP CONSTRAINT IF EXISTS user_otps_type_check;
