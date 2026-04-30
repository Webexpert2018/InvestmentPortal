-- Migration: Add assigned_accountant_id to investors table
ALTER TABLE investors 
ADD COLUMN IF NOT EXISTS assigned_accountant_id uuid REFERENCES staff(id);
