-- Add subaccount columns to investors table
ALTER TABLE investors 
ADD COLUMN IF NOT EXISTS investor_type VARCHAR(50) DEFAULT 'personal' CHECK (investor_type IN ('personal', 'minor', 'entity')),
ADD COLUMN IF NOT EXISTS entity_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50) CHECK (entity_type IN ('LLC', 'Corporation', 'Trust', 'Partnership', 'Nonprofit', 'Others')),
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES investors(id) ON DELETE SET NULL;
