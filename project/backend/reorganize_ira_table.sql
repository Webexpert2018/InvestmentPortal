
-- 1. Backup existing data
CREATE TEMP TABLE ira_accounts_backup AS SELECT * FROM ira_accounts;

-- 2. Drop the original table
DROP TABLE ira_accounts CASCADE;

-- 3. Recreate the table with Status next to Account Type
CREATE TABLE ira_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email VARCHAR(255),
    account_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending', -- Moved status up next to account_type
    account_number VARCHAR(100) UNIQUE,
    custodian_name VARCHAR(255),
    beneficiary TEXT,
    middle_name VARCHAR(100),
    suffix VARCHAR(50),
    marital_status VARCHAR(50),
    mailing_address_same BOOLEAN DEFAULT TRUE,
    mailing_address_1 VARCHAR(255),
    mailing_address_2 VARCHAR(255),
    mailing_city VARCHAR(100),
    mailing_state VARCHAR(100),
    mailing_zip_code VARCHAR(20),
    mailing_country VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Restore data into the new structure (matching the new order)
INSERT INTO ira_accounts (
    id, user_id, email, account_type, status, account_number, custodian_name, beneficiary,
    middle_name, suffix, marital_status, mailing_address_same,
    mailing_address_1, mailing_address_2, mailing_city, mailing_state,
    mailing_zip_code, mailing_country, created_at, updated_at
)
SELECT 
    id, user_id, email, account_type, status, account_number, custodian_name, beneficiary,
    middle_name, suffix, marital_status, mailing_address_same,
    mailing_address_1, mailing_address_2, mailing_city, mailing_state,
    mailing_zip_code, mailing_country, created_at, updated_at
FROM ira_accounts_backup;

-- 5. Drop temp table
DROP TABLE ira_accounts_backup;
