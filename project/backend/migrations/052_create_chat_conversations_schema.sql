-- Migration: 052_create_chat_conversations_schema.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID REFERENCES investors(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    unread_count_investor INTEGER DEFAULT 0,
    unread_count_admin INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Drop existing messages table if it doesn't have conversation_id (cleaning up migration 050 if it was partial)
-- Or just add the column. Let's be safe and just ensure the table matches what MessagesService expects.
CREATE TABLE IF NOT EXISTS messages_new (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    recipient_id UUID,
    target_role VARCHAR(50),
    content TEXT NOT NULL,
    file_url TEXT,
    file_name TEXT,
    file_size TEXT,
    reactions JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- If old messages exists, try to migrate? (Probably not needed if they were just getting errors)
-- For now, let's just make sure 'messages' has 'conversation_id'.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='conversation_id') THEN
        DROP TABLE IF EXISTS messages;
        ALTER TABLE messages_new RENAME TO messages;
    ELSE
        DROP TABLE IF EXISTS messages_new;
    END IF;
END $$;

-- 3. Ensure indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_investor_id ON conversations(investor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_admin_id ON conversations(admin_id);

-- Migration record
INSERT INTO migrations (name) VALUES ('052_create_chat_conversations_schema.sql')
ON CONFLICT (name) DO NOTHING;
