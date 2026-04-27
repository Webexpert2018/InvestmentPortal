-- Migration: 053_add_group_chats_schema.sql

-- Add group columns to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS group_name VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_by UUID;

-- Create conversation participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- References investors, staff, or users
    is_admin BOOLEAN DEFAULT FALSE, -- Group admin (can remove others)
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    unread_count INTEGER DEFAULT 0,
    UNIQUE(conversation_id, user_id)
);

-- Migrate existing 1-on-1 conversations into participants table
INSERT INTO conversation_participants (conversation_id, user_id, unread_count)
SELECT id, investor_id, unread_count_investor FROM conversations WHERE investor_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO conversation_participants (conversation_id, user_id, unread_count)
SELECT id, admin_id, unread_count_admin FROM conversations WHERE admin_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Migration record
INSERT INTO migrations (name) VALUES ('053_add_group_chats_schema.sql')
ON CONFLICT (name) DO NOTHING;
