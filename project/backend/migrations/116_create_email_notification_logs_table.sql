-- Migration: 116_create_email_notification_logs_table.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS email_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    recipient_user_id UUID,
    subject VARCHAR(500) NOT NULL,
    template_name VARCHAR(100),
    body_snippet TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'SENT', -- 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED'
    provider VARCHAR(50),                       -- 'brevo', 'smtp', 'dummy'
    provider_message_id VARCHAR(255),
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    triggered_by_user_id UUID,
    related_entity_type VARCHAR(50),             -- 'INVESTOR', 'STAFF', 'USER', 'FUND_TRANSFER', 'DOCUMENT_SIGNATURE', 'CAMPAIGN'
    related_entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit filtering, searching and performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_notification_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_notification_type ON email_notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_related_entity ON email_notification_logs(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_user_id ON email_notification_logs(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_triggered_by ON email_notification_logs(triggered_by_user_id);

-- Trigger to auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_email_notification_logs_updated_at ON email_notification_logs;
CREATE TRIGGER update_email_notification_logs_updated_at
    BEFORE UPDATE ON email_notification_logs
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
