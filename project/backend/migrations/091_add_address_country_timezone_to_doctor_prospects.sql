-- Migration 091: Add street_address, country, and timezone to doctor_prospects table

ALTER TABLE doctor_prospects
ADD COLUMN IF NOT EXISTS country VARCHAR(255),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(100);
