-- Migration: Add assigned_ir_id to investors table
-- Tracks which Investor Relations staff member is assigned to each investor

ALTER TABLE investors ADD COLUMN IF NOT EXISTS assigned_ir_id UUID REFERENCES staff(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_investors_assigned_ir ON investors(assigned_ir_id);

-- Record migration
INSERT INTO migrations (name) VALUES ('039_add_assigned_ir_to_investors.sql')
ON CONFLICT (name) DO NOTHING;
