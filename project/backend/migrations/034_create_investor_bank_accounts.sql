-- Migration: Create Investor Bank Accounts Table
-- This table stores bank details for investors to be used for reinvestments or withdrawals.

CREATE TABLE IF NOT EXISTS investor_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  routing_number VARCHAR(100) NOT NULL, -- ABA/Routing number
  beneficiary_name VARCHAR(255) NOT NULL,
  bank_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by investor
CREATE INDEX IF NOT EXISTS idx_investor_bank_accounts_investor_id ON investor_bank_accounts(investor_id);

-- Record migration
INSERT INTO migrations (name) VALUES ('034_create_investor_bank_accounts.sql')
ON CONFLICT (name) DO NOTHING;
