-- Migration: 117_widen_email_logs_id_columns.sql
-- Widen ID columns to VARCHAR(255) to support both UUIDs (users, investors, staff) and VARCHAR string IDs (doctor_prospects apollo_id)

ALTER TABLE email_notification_logs 
  ALTER COLUMN recipient_user_id TYPE VARCHAR(255) USING recipient_user_id::VARCHAR(255),
  ALTER COLUMN related_entity_id TYPE VARCHAR(255) USING related_entity_id::VARCHAR(255),
  ALTER COLUMN triggered_by_user_id TYPE VARCHAR(255) USING triggered_by_user_id::VARCHAR(255);
