-- Migration: Create Pipeline Stages and Link to Investors
-- Adds support for a scalable Kanban-style pipeline.

-- 1. Create pipeline_stages table
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#F3F4F6',
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add pipeline_stage_id column to investors
ALTER TABLE investors 
ADD COLUMN IF NOT EXISTS pipeline_stage_id INTEGER REFERENCES pipeline_stages(id) ON DELETE SET NULL;

-- 3. Populate initial stages with colors from screenshot
INSERT INTO pipeline_stages (name, color, order_index) VALUES 
('TO CONTACT', '#F3F4F6', 1),
('CONTACTED', '#DBEAFE', 2),
('INTERESTED', '#D1FAE5', 3),
('SET UP IN PORTAL', '#E9D5FF', 4),
('IRA SET UP', '#DDD6FE', 5),
('READY TO FUND', '#FED7AA', 6)
ON CONFLICT DO NOTHING;

-- 4. Assign all existing investors to the first stage (TO CONTACT)
DO $$
DECLARE
    first_stage_id INTEGER;
BEGIN
    SELECT id INTO first_stage_id FROM pipeline_stages WHERE order_index = 1 LIMIT 1;
    
    IF first_stage_id IS NOT NULL THEN
        UPDATE investors SET pipeline_stage_id = first_stage_id WHERE pipeline_stage_id IS NULL;
    END IF;
END $$;

-- 5. Record migration
INSERT INTO migrations (name) VALUES ('040_create_pipeline_stages.sql')
ON CONFLICT (name) DO NOTHING;
