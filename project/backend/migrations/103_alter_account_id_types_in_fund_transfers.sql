ALTER TABLE fund_transfers ALTER COLUMN from_account_id TYPE VARCHAR(255) USING from_account_id::text;
ALTER TABLE fund_transfers ALTER COLUMN to_account_id TYPE VARCHAR(255) USING to_account_id::text;
