-- Migration 093: Add work_phone column to doctor_prospects table

ALTER TABLE doctor_prospects
ADD COLUMN IF NOT EXISTS work_phone VARCHAR(255);
