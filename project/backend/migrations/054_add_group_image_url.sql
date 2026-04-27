-- Migration: 054_add_group_image_url.sql
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS group_image_url TEXT;

INSERT INTO migrations (name) VALUES ('054_add_group_image_url.sql')
ON CONFLICT (name) DO NOTHING;
