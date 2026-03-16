-- Rename 'compliance' role to 'accountant'
-- Update the check constraint on the users table

-- 1. Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Update existing data
UPDATE users SET role = 'accountant' WHERE role = 'compliance';

-- 3. Add the new constraint
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('investor', 'admin', 'accountant'));

-- Record this migration
INSERT INTO migrations (name) VALUES ('005_rename_compliance_to_accountant.sql')
ON CONFLICT (name) DO NOTHING;
