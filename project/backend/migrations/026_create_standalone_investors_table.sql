-- Migration: Standalone Investors Table (Refactored)
-- Decouples investors from the users table and re-maps all foreign key dependencies.

-- 1. Drop existing foreign key constraints that point to 'users'
ALTER TABLE investments DROP CONSTRAINT IF EXISTS investments_user_id_fkey;
ALTER TABLE tax_vault_documents DROP CONSTRAINT IF EXISTS tax_vault_documents_user_id_fkey;
ALTER TABLE tax_vault_documents DROP CONSTRAINT IF EXISTS tax_vault_documents_uploaded_by_id_fkey;
-- ALTER TABLE investor_profiles DROP CONSTRAINT IF EXISTS investor_profiles_user_id_fkey; -- Table does not exist in current schema
ALTER TABLE portfolios DROP CONSTRAINT IF EXISTS portfolios_user_id_fkey;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_user_id_fkey;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_verified_by_fkey;
ALTER TABLE ira_accounts DROP CONSTRAINT IF EXISTS ira_accounts_user_id_fkey;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE compliance_reports DROP CONSTRAINT IF EXISTS compliance_reports_user_id_fkey;
ALTER TABLE compliance_reports DROP CONSTRAINT IF EXISTS compliance_reports_generated_by_fkey;
ALTER TABLE user_otps DROP CONSTRAINT IF EXISTS user_otps_user_id_fkey;
ALTER TABLE fund_flows DROP CONSTRAINT IF EXISTS fund_flows_user_id_fkey;

-- 2. Create the standalone investors table
CREATE TABLE IF NOT EXISTS investors (
  id UUID PRIMARY KEY, -- We keep the same UUID from users table
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'investor',
  kyc_status VARCHAR(20) DEFAULT 'pending',
  profile_image_url TEXT,
  dob DATE,
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(50),
  country VARCHAR(100),
  tax_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. MIGRATE DATA: Copy everything while preserving UUIDs
INSERT INTO investors (
  id, full_name, email, phone, password_hash, role, kyc_status, profile_image_url, 
  dob, address_line1, address_line2, city, state, zip_code, country, tax_id, status, created_at, updated_at
)
SELECT 
  u.id, 
  (u.first_name || ' ' || COALESCE(u.last_name, '')) as full_name, 
  u.email, u.phone, u.password_hash, u.role, 
  u.kyc_status, u.profile_image_url, u.dob, 
  u.address_line1, u.address_line2, u.city, u.state, u.zip_code, u.country, u.tax_id, 
  u.status, u.created_at, u.updated_at
FROM users u
WHERE u.role = 'investor'
  OR u.id IN (SELECT user_id FROM investments)
  OR u.id IN (SELECT user_id FROM portfolios)
  OR u.id IN (SELECT user_id FROM ira_accounts)
ON CONFLICT (id) DO NOTHING;

-- 4. CLEANUP: Delete migrated investors from the old tables
-- DELETE FROM investor_profiles WHERE user_id IN (SELECT id FROM investors); -- Table does not exist in current schema
DELETE FROM users WHERE role = 'investor';

-- 4.5 CLEANUP ORPHANS: Remove records in dependent tables that reference non-existent users
-- This ensures that the foreign key constraints in Step 5 will not fail due to orphaned data.
DELETE FROM investments WHERE user_id NOT IN (SELECT id FROM investors);
DELETE FROM portfolios WHERE user_id NOT IN (SELECT id FROM investors);
DELETE FROM ira_accounts WHERE user_id NOT IN (SELECT id FROM investors);

-- 5. RE-MAP CONSTRAINTS (Selective)
-- For investments, they always belong to investors now
ALTER TABLE investments ADD CONSTRAINT investments_user_id_fkey FOREIGN KEY (user_id) REFERENCES investors(id) ON DELETE CASCADE;
ALTER TABLE portfolios ADD CONSTRAINT portfolios_user_id_fkey FOREIGN KEY (user_id) REFERENCES investors(id) ON DELETE CASCADE;
ALTER TABLE ira_accounts ADD CONSTRAINT ira_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES investors(id) ON DELETE CASCADE;

-- For Audit Logs & Documents (Shared by Admin/Investors), we keep them as UUID without strict FK 
-- to allow them to point to either 'users' or 'investors'. This is safer for mixed logs.

-- Record migration
INSERT INTO migrations (name) VALUES ('026_create_standalone_investors_table.sql')
ON CONFLICT (name) DO NOTHING;
