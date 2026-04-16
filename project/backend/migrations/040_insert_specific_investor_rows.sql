-- Migration: Insert specific old investor bank account rows into user_bank_accounts
-- Inserts provided rows with their original IDs and sets role = 'investor'

INSERT INTO user_bank_accounts (id, user_id, role, bank_name, account_number, routing_number, beneficiary_name, bank_address, created_at, updated_at, status, bank_description)
VALUES
('ee88b933-9efe-434d-9301-28de68af8901','99b6e6d7-3335-40f1-b791-b54b5b98de2b','investor','First National Bank','123456789012','021000021','John A. Smith','123 Main Street, Suite 400','2026-04-15 17:00:43.128804+05:30','2026-04-15 17:11:50.250378+05:30','active','Primary checking account f')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  role = EXCLUDED.role,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  routing_number = EXCLUDED.routing_number,
  beneficiary_name = EXCLUDED.beneficiary_name,
  bank_address = EXCLUDED.bank_address,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  status = EXCLUDED.status,
  bank_description = EXCLUDED.bank_description;

INSERT INTO user_bank_accounts (id, user_id, role, bank_name, account_number, routing_number, beneficiary_name, bank_address, created_at, updated_at, status, bank_description)
VALUES
('78ae55ca-8773-4ce8-989c-12e51f555420','613c7f84-9c36-4f13-af86-8ebadb472b75','investor','HHL Commercial Bank','32424543554','123456789','Tabitha Gates','gfkdjgvbklfgg gffg','2026-04-14 11:59:22.238628+05:30','2026-04-15 17:17:25.435894+05:30','active','Primary checking account for test transactions')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  role = EXCLUDED.role,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  routing_number = EXCLUDED.routing_number,
  beneficiary_name = EXCLUDED.beneficiary_name,
  bank_address = EXCLUDED.bank_address,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  status = EXCLUDED.status,
  bank_description = EXCLUDED.bank_description;

INSERT INTO user_bank_accounts (id, user_id, role, bank_name, account_number, routing_number, beneficiary_name, bank_address, created_at, updated_at, status, bank_description)
VALUES
('643527e6-625e-4b97-98fc-bcb074af7db2','613c7f84-9c36-4f13-af86-8ebadb472b75','investor','SSD Commercial Bank','8654345678','876543219','Tabitha Gates','gfdfghjk vfghj','2026-04-14 11:44:38.634398+05:30','2026-04-15 17:17:36.12992+05:30','active','Primary checking account for test transactions')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  role = EXCLUDED.role,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  routing_number = EXCLUDED.routing_number,
  beneficiary_name = EXCLUDED.beneficiary_name,
  bank_address = EXCLUDED.bank_address,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  status = EXCLUDED.status,
  bank_description = EXCLUDED.bank_description;

INSERT INTO user_bank_accounts (id, user_id, role, bank_name, account_number, routing_number, beneficiary_name, bank_address, created_at, updated_at, status, bank_description)
VALUES
('b162f210-c358-43f3-ad3f-57aee8ac54c5','613c7f84-9c36-4f13-af86-8ebadb472b75','investor','USH Commercial Bank','324243543546','987654322','Tabitha Gates','Booth No. 54, Street 5, Chandigarh,Chandigarh','2026-04-14 11:36:48.250964+05:30','2026-04-15 17:17:39.421793+05:30','active','Primary checking account for test transactions')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  role = EXCLUDED.role,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  routing_number = EXCLUDED.routing_number,
  beneficiary_name = EXCLUDED.beneficiary_name,
  bank_address = EXCLUDED.bank_address,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  status = EXCLUDED.status,
  bank_description = EXCLUDED.bank_description;

INSERT INTO user_bank_accounts (id, user_id, role, bank_name, account_number, routing_number, beneficiary_name, bank_address, created_at, updated_at, status, bank_description)
VALUES
('1619c8da-cbfe-4d95-ad47-dd17c2829a3e','99b6e6d7-3335-40f1-b791-b54b5b98de2b','investor','National Credit Bank','675849302156','074000010','David K. Wilson','654 Pine Street, Seattle, WA 98101, USA','2026-04-15 17:48:56.435456+05:30','2026-04-15 17:48:56.435456+05:30','active','Temporary holding account for QA testing')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  role = EXCLUDED.role,
  bank_name = EXCLUDED.bank_name,
  account_number = EXCLUDED.account_number,
  routing_number = EXCLUDED.routing_number,
  beneficiary_name = EXCLUDED.beneficiary_name,
  bank_address = EXCLUDED.bank_address,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  status = EXCLUDED.status,
  bank_description = EXCLUDED.bank_description;

-- Record migration
INSERT INTO migrations (name) VALUES ('040_insert_specific_investor_rows.sql') ON CONFLICT (name) DO NOTHING;
