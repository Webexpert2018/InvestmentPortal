-- Migration: 118_create_email_campaigns_table.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(500) NOT NULL,
    preheader VARCHAR(500),
    from_name VARCHAR(255) NOT NULL DEFAULT 'Ovalia Capital',
    from_email VARCHAR(255) NOT NULL DEFAULT 'invest@ovaliacapital.com',
    fund_id VARCHAR(100) NOT NULL,
    fund_name VARCHAR(255) NOT NULL,
    recipient_count INTEGER NOT NULL DEFAULT 0,
    body TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft', -- 'Draft', 'Scheduled', 'Sent', 'Failed'
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    failed_reason TEXT,
    created_by_user_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_fund_id ON email_campaigns(fund_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at DESC);

-- Trigger to auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON email_campaigns;
CREATE TRIGGER update_email_campaigns_updated_at
    BEFORE UPDATE ON email_campaigns
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

