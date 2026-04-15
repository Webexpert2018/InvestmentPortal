-- Update Administrative Roles Constraints
-- This migration updates the check constraints on users and staff tables to support new roles.

-- 1. Update users table role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('investor', 'admin', 'executive_admin', 'accountant', 'fund_admin', 'investor_relations'));

-- 2. Update staff table role constraint
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;
ALTER TABLE staff ADD CONSTRAINT staff_role_check 
  CHECK (role IN ('admin', 'executive_admin', 'accountant', 'fund_admin', 'investor_relations', 'relations_associate', 'partnership'));

-- Note: Role conversion (e.g., admin -> executive_admin) will be handled manually by the user.
