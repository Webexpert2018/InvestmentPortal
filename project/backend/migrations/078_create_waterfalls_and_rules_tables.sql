-- Create waterfalls table linked to old_funds (project_id)
CREATE TABLE IF NOT EXISTS waterfalls (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES old_funds(project_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast retrieval by project_id
CREATE INDEX IF NOT EXISTS idx_waterfalls_project_id ON waterfalls(project_id);

-- Create waterfall_rules table linked to waterfalls
CREATE TABLE IF NOT EXISTS waterfall_rules (
    id SERIAL PRIMARY KEY,
    waterfall_id INTEGER NOT NULL REFERENCES waterfalls(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    section VARCHAR(255),
    template VARCHAR(100) NOT NULL,
    splits JSONB DEFAULT '[]'::jsonb,
    hurdles JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast retrieval by waterfall_id
CREATE INDEX IF NOT EXISTS idx_waterfall_rules_waterfall_id ON waterfall_rules(waterfall_id);
