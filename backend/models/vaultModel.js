export const createVaultTableQuery = `
CREATE TABLE IF NOT EXISTS vault_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'New Conversation',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vault_messages (
    id SERIAL PRIMARY KEY,
    chat_id UUID REFERENCES vault_chats(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
    text TEXT NOT NULL,
    model_tier VARCHAR(20) DEFAULT 'mini',
    is_failover BOOLEAN DEFAULT FALSE,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vault_chats_user_id ON vault_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_messages_chat_id ON vault_messages(chat_id);
`;