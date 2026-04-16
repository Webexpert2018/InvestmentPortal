-- Migration: Add status to pipeline_stages and ensure integer types
-- Adds status column to stages and fixes potential type mismatches.

-- 1. Add status column to pipeline_stages if not exists
ALTER TABLE pipeline_stages 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- 2. Ensure investors.pipeline_stage_id is INTEGER
-- If it was somehow created as something else, we cast it. 
-- Note: This might fail if there's invalid data, but for now we expect it to be clean or compatible.
DO $$ 
BEGIN
    -- Check actual type of the column
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'investors' 
        AND column_name = 'pipeline_stage_id' 
        AND data_type = 'uuid'
    ) THEN
        -- Drop foreign key if it exists to allow type change
        ALTER TABLE investors DROP CONSTRAINT IF EXISTS investors_pipeline_stage_id_fkey;
        
        -- Alter column type
        ALTER TABLE investors 
        ALTER COLUMN pipeline_stage_id TYPE INTEGER USING pipeline_stage_id::integer;
        
        -- Re-add foreign key
        ALTER TABLE investors 
        ADD CONSTRAINT investors_pipeline_stage_id_fkey 
        FOREIGN KEY (pipeline_stage_id) REFERENCES pipeline_stages(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Add index for performance if not exists
CREATE INDEX IF NOT EXISTS idx_investors_pipeline_stage_id ON investors(pipeline_stage_id);

-- 4. Record migration
INSERT INTO migrations (name) VALUES ('041_add_status_to_pipeline_stages.sql')
ON CONFLICT (name) DO NOTHING;
