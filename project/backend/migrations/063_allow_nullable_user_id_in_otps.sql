-- Migration: Make user_id nullable and add email column to user_otps
-- This allows storing OTPs for users who haven't completed signup yet

ALTER TABLE user_otps ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE user_otps ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Update the type constraint if it was recreated or just add a comment
-- Type 'SIGNUP' will be used for email verification during onboarding
