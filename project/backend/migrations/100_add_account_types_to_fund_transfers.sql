ALTER TABLE fund_transfers
ADD COLUMN IF NOT EXISTS from_account_type VARCHAR(50) DEFAULT 'personal',
ADD COLUMN IF NOT EXISTS from_account_id UUID NULL,
ADD COLUMN IF NOT EXISTS to_account_type VARCHAR(50) DEFAULT 'personal',
ADD COLUMN IF NOT EXISTS to_account_id UUID NULL;
