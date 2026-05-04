-- Migration: Remove ssn column from ira_accounts and ensure data integrity
-- Whenever SSN is provided in IRA context, it should update the investors table's tax_id.

-- 1. Sync any existing SSN data from ira_accounts to investors.tax_id if investors.tax_id is null
UPDATE investors i
SET tax_id = ira.ssn
FROM ira_accounts ira
WHERE i.id = ira.user_id
  AND (i.tax_id IS NULL OR i.tax_id = '')
  AND ira.ssn IS NOT NULL
  AND ira.ssn != '';

-- 2. Drop the ssn column from ira_accounts
ALTER TABLE ira_accounts
DROP COLUMN IF EXISTS ssn;

-- Record this migration
INSERT INTO migrations (name) VALUES ('059_remove_ssn_from_ira_accounts.sql')
ON CONFLICT (name) DO NOTHING;
