-- Migration 085: Ensure duration column exists on webinars table

ALTER TABLE webinars ADD COLUMN IF NOT EXISTS duration VARCHAR(50) DEFAULT '45 mins';
