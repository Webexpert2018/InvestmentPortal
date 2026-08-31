CREATE TABLE IF NOT EXISTS investment_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID REFERENCES investors(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES funds(id) ON DELETE CASCADE,
  account_id VARCHAR(100),
  account_type VARCHAR(50),
  amount NUMERIC,
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);
