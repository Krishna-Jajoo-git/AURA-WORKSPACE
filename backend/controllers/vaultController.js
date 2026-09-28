import { generateAuraResponse, analyzeSnippets, generateFirstTurnTitle } from '../services/aiService.js';
import pool from '../config/db.js';
import { createSignedChatToken, verifySignedChatToken } from '../utils/tokenSignature.js';
import { sendNotificationToUser } from '../utils/socket.js';

const formatChat = (chat, userId) => ({
  ...chat,
  token: createSignedChatToken(chat.id, userId),
});

// 1. Fetch all chats for logged-in user
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, title, is_pinned, created_at, updated_at 
       FROM vault_chats 
       WHERE user_id = $1 
       ORDER BY is_pinned DESC, updated_at DESC`,
      [userId]
    );

    const signedChats = result.rows.map((chat) => formatChat(chat, userId));
    return res.status(200).json({ success: true, chats: signedChats });
  } catch (err) {
    console.error('Error fetching user chats:', err);
    return res.status(500).json({ success: false, message: 'Error fetching chats' });
  }
};

// 2. Create a new empty chat session
export const createNewChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title = 'New Conversation' } = req.body;

    const result = await pool.query(
      `INSERT INTO vault_chats (user_id, title) 
       VALUES ($1, $2) 
       RETURNING id, title, is_pinned, created_at, updated_at`,
      [userId, title]
    );

    const newChat = formatChat(result.rows[0], userId);
    return res.status(201).json({ success: true, chat: newChat });
  } catch (err) {
    console.error('Error creating new chat:', err);
    return res.status(500).json({ success: false, message: 'Error creating new chat' });
  }
};

// 3. Get all messages for a specific chat thread
export const getChatMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId: chatToken } = req.params;

    const chatId = verifySignedChatToken(chatToken, userId);
    if (!chatId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Invalid or altered chat token.',
      });
    }

    const chatCheck = await pool.query(
      `SELECT id FROM vault_chats WHERE id = $1 AND user_id = $2`,
      [chatId, userId]
    );

    if (chatCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    const result = await pool.query(
      `SELECT id, chat_id, role, text, model_tier AS "modelTier", is_failover AS "isFailOver", attachments, created_at 
       FROM vault_messages 
       WHERE chat_id = $1 
       ORDER BY created_at ASC`,
      [chatId]
    );

    return res.status(200).json({ success: true, messages: result.rows });
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    return res.status(500).json({ success: false, message: 'Error fetching messages' });
  }
};

// 4. Send prompt, query Gemini, persist messages & handle conversational renaming
export const sendVaultMessage = async (req, res) => {
  const userId = req.user.id;
  try {
    let { chatId: chatToken, prompt, mode = 'mini', attachments = [] } = req.body;

    if (!prompt && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ success: false, message: 'Prompt or attachments are required' });
    }

    let isNewChat = false;
    let chatId = null;
    let currentChatRecord = null;

    if (!chatToken) {
      const newChat = await pool.query(
        `INSERT INTO vault_chats (user_id, title) VALUES ($1, 'New Conversation') RETURNING *`,
        [userId]
      );
      chatId = newChat.rows[0].id;
      currentChatRecord = newChat.rows[0];
      isNewChat = true;
    } else {
      chatId = verifySignedChatToken(chatToken, userId);
      if (!chatId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Invalid or altered chat token.',
        });
      }

      const chatCheck = await pool.query(
        `SELECT id, title FROM vault_chats WHERE id = $1 AND user_id = $2`,
        [chatId, userId]
      );

      if (chatCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Chat not found' });
      }

      currentChatRecord = chatCheck.rows[0];
    }

    // Persist user message
    const attachmentMeta = attachments.map((a) => ({ name: a.name, mimeType: a.mimeType }));
    await pool.query(
      `INSERT INTO vault_messages (chat_id, role, text, attachments) VALUES ($1, 'user', $2, $3)`,
      [chatId, prompt || '', JSON.stringify(attachmentMeta)]
    );

    // =========================================================================
    // [CONVERSATIONAL RENAMING SHORT-CIRCUIT]
    // If the user is issuing a pure rename command, update PostgreSQL directly
    // and answer instantly without querying Gemini. This saves 100% of tokens
    // and prevents upstream 429/timeout errors from breaking renames.
    // =========================================================================
    const flexibleRenameRegex = /^(?:again\s+|please\s+|can\s+you\s+)?(?:rename|name)\s+(?:this\s+)?chat\s+(?:to|as|:)\s+["']?([a-zA-Z0-9 _-]{2,40})["']?[\.\?!]?$/i;
    const renameMatch = prompt?.trim().match(flexibleRenameRegex);

    if (renameMatch && renameMatch[1]) {
      const manualRenameTitle = renameMatch[1].trim().replace(/\s+/g, ' ');

      await pool.query(
        `UPDATE vault_chats SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3`,
        [manualRenameTitle, chatId, userId]
      );

      const confirmText = `Done! This chat has been renamed to **"${manualRenameTitle}"**.\n\nWhat are we building or debugging under this project today?`;

      const savedAiMsg = await pool.query(
        `INSERT INTO vault_messages (chat_id, role, text, model_tier, is_failover) 
         VALUES ($1, 'assistant', $2, 'mini', false) 
         RETURNING id, role, text, model_tier AS "modelTier", is_failover AS "isFailOver", created_at`,
        [chatId, confirmText]
      );

      return res.status(200).json({
        success: true,
        chatId,
        token: createSignedChatToken(chatId, userId),
        isNewChat,
        updatedTitle: manualRenameTitle,
        assistantMessage: savedAiMsg.rows[0],
      });
    }
    // =========================================================================

    // Retrieve previous 6 messages for context
    const historyRes = await pool.query(
      `SELECT role, text FROM vault_messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT 6`,
      [chatId]
    );
    const conversationHistory = historyRes.rows.reverse();

    // Query Gemini
    const aiResponse = await generateAuraResponse(prompt, mode, attachments, conversationHistory);

    // Real-Time Telemetry: Failover Alert
    if (aiResponse.isFailOver) {
      sendNotificationToUser(userId, 'alert:model_failover', {
        type: 'warning',
        title: 'Model Engine Failover',
        message: `Primary ${mode.toUpperCase()} engine reached capacity. Switched to backup model (${aiResponse.modelName}).`,
        timestamp: new Date().toISOString(),
      });
    }

    // Persist assistant reply
    const savedAiMsg = await pool.query(
      `INSERT INTO vault_messages (chat_id, role, text, model_tier, is_failover) 
       VALUES ($1, 'assistant', $2, $3, $4) 
       RETURNING id, role, text, model_tier AS "modelTier", is_failover AS "isFailOver", created_at`,
      [chatId, aiResponse.text, aiResponse.modelUsed, aiResponse.isFailOver]
    );

    // One-time automatic title generation for turn 1 (if not a manual rename)
    if (isNewChat || currentChatRecord?.title === 'New Conversation') {
      generateFirstTurnTitle(prompt, aiResponse.text)
        .then(async (smartTitle) => {
          try {
            await pool.query(
              `UPDATE vault_chats SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3`,
              [smartTitle, chatId, userId]
            );
          } catch (e) {
            console.error('Failed to update smart title:', e.message);
          }
        })
        .catch((err) => console.error('First turn auto-titling error:', err.message));
    }

    await pool.query(`UPDATE vault_chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [chatId]);

    return res.status(200).json({
      success: true,
      chatId,
      token: createSignedChatToken(chatId, userId),
      isNewChat,
      updatedTitle: null,
      assistantMessage: savedAiMsg.rows[0],
    });
  } catch (err) {
    console.error('Error in sendVaultMessage:', err);

    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      sendNotificationToUser(userId, 'alert:rate_limit', {
        type: 'error',
        title: 'Quota Limit Exceeded',
        message: 'Your request hit Google Gemini upstream rate limits. Please wait a moment before sending your next prompt.',
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(500).json({ success: false, message: err.message || 'Failed to process message' });
  }
};

// 5. Rename chat title manually via endpoint
export const updateChatTitle = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId: chatToken } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title cannot be empty' });
    }

    const chatId = verifySignedChatToken(chatToken, userId);
    if (!chatId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Invalid or altered chat token.',
      });
    }

    const cleanTitle = title.trim().replace(/\s+/g, ' ').slice(0, 40);
    const result = await pool.query(
      `UPDATE vault_chats 
       SET title = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND user_id = $3 
       RETURNING id, title`,
      [cleanTitle, chatId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    return res.status(200).json({ success: true, title: result.rows[0].title });
  } catch (err) {
    console.error('Error renaming chat:', err);
    return res.status(500).json({ success: false, message: 'Failed to rename chat' });
  }
};

// 6. Toggle pinned status
export const togglePinChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId: chatToken } = req.params;

    const chatId = verifySignedChatToken(chatToken, userId);
    if (!chatId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Invalid or altered chat token.',
      });
    }

    const result = await pool.query(
      `UPDATE vault_chats 
       SET is_pinned = NOT is_pinned, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 
       RETURNING id, is_pinned`,
      [chatId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    return res.status(200).json({ success: true, isPinned: result.rows[0].is_pinned });
  } catch (err) {
    console.error('Error toggling pin:', err);
    return res.status(500).json({ success: false, message: 'Failed to update pin' });
  }
};

// 7. Delete conversation thread
export const deleteChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId: chatToken } = req.params;

    const chatId = verifySignedChatToken(chatToken, userId);
    if (!chatId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Invalid or altered chat token.',
      });
    }

    const result = await pool.query(
      `DELETE FROM vault_chats WHERE id = $1 AND user_id = $2 RETURNING id`,
      [chatId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    return res.status(200).json({ success: true, message: 'Chat deleted successfully' });
  } catch (err) {
    console.error('Error deleting chat:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete chat' });
  }
};

// 8. Direct AI response generation without session persistence
export const generateResponse = async (req, res) => {
  try {
    const { prompt, mode = 'mini', attachments = [] } = req.body;
    const aiResponse = await generateAuraResponse(prompt, mode, attachments);
    return res.status(200).json({ success: true, response: aiResponse });
  } catch (err) {
    console.error('Error in generateResponse:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to generate response' });
  }
};

// 9. Analyze code snippets and stack traces
export const analyzeCode = async (req, res) => {
  try {
    const { codeBlock, stackTrace = '' } = req.body;
    const analysis = await analyzeSnippets(codeBlock, stackTrace);
    return res.status(200).json({ success: true, analysis });
  } catch (err) {
    console.error('Error in analyzeCode:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to analyze code' });
  }
};