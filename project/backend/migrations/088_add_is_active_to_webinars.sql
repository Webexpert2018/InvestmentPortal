-- Migration to add is_active column to webinars table
ALTER TABLE webinars ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Initially set the latest created webinar as active so there is always one active webinar
UPDATE webinars SET is_active = true WHERE id = (
    SELECT id FROM webinars ORDER BY created_at DESC LIMIT 1
);
