-- Migration: create ira_account_types table and seed it
CREATE TABLE IF NOT EXISTS ira_account_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial values
INSERT INTO ira_account_types (name) VALUES
    ('Traditional'),
    ('Roth'),
    ('SEP'),
    ('Roth SEP'),
    ('Rollover')
ON CONFLICT (name) DO NOTHING;

-- Record this migration
INSERT INTO migrations (name) VALUES ('013_create_ira_account_types.sql')
ON CONFLICT (name) DO NOTHING;
