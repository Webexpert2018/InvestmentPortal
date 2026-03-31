-- Migration: add DB Plan to ira_account_types
-- Created: 2026-03-31

INSERT INTO ira_account_types (name) VALUES ('DB Plan')
ON CONFLICT (name) DO NOTHING;

-- Record this migration
INSERT INTO migrations (name) VALUES ('014_add_db_plan_to_ira_account_types.sql')
ON CONFLICT (name) DO NOTHING;
