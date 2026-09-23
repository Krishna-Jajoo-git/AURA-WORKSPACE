import { generateAuraResponse, analyzeSnippets } from "../services/aiService.js";
import pool from "../config/db.js";
import { createSignedChatToken, verifySignedChatToken } from "../utils/tokenSignature.js";

// Helper to format chat object with signed token
const formatChat = (chat, userId) => ({
  ...chat,
  token: createSignedChatToken(chat.id, userId),
});

// 1. Fetch all chats for logged-in user (pinned first, then newest)
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
    console.error("Error fetching user chats:", err);
    return res.status(500).json({ success: false, message: "Error fetching chats" });
  }
};

// 2. Create a new empty chat session
export const createNewChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title = "New Conversation" } = req.body;

    const result = await pool.query(
      `INSERT INTO vault_chats (user_id, title) 
       VALUES ($1, $2) 
       RETURNING id, title, is_pinned, created_at, updated_at`,
      [userId, title]
    );

    const newChat = formatChat(result.rows[0], userId);
    return res.status(201).json({ success: true, chat: newChat });
  } catch (err) {
    console.error("Error creating new chat:", err);
    return res.status(500).json({ success: false, message: "Error creating new chat" });
  }
};

// 3. Get all messages for a specific chat thread
export const getChatMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId: chatToken } = req.params;

    // Verify HMAC signature to prevent URL alteration
    const chatId = verifySignedChatToken(chatToken, userId);
    if (!chatId) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Invalid or altered chat token.",
      });
    }

    // Verify chat ownership in DB
    const chatCheck = await pool.query(
      `SELECT id FROM vault_chats WHERE id = $1 AND user_id = $2`,
      [chatId, userId]
    );

    if (chatCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Chat not found" });
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
    console.error("Error fetching chat messages:", err);
    return res.status(500).json({ success: false, message: "Error fetching messages" });
  }
};

// 4. Send prompt, query Gemini model, and persist user & AI messages
export const sendVaultMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    let { chatId: chatToken, prompt, mode = "mini", attachments = [] } = req.body;

    if (!prompt && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ success: false, message: "Prompt or attachments are required" });
    }

    let isNewChat = false;
    let chatId = null;

    // Create session if no chat exists yet
    if (!chatToken) {
      const generatedTitle = prompt ? prompt.slice(0, 35) + (prompt.length > 35 ? "..." : "") : "New Conversation";
      const newChat = await pool.query(
        `INSERT INTO vault_chats (user_id, title) VALUES ($1, $2) RETURNING *`,
        [userId, generatedTitle || "New Conversation"]
      );
      chatId = newChat.rows[0].id;
      isNewChat = true;
    } else {
      // Verify token signature against tampering
      chatId = verifySignedChatToken(chatToken, userId);
      if (!chatId) {
        return res.status(403).json({
          success: false,
          message: "Access denied: Invalid or altered chat token.",
        });
      }

      // Validate chat session ownership
      const chatCheck = await pool.query(
        `SELECT id, title FROM vault_chats WHERE id = $1 AND user_id = $2`,
        [chatId, userId]
      );

      if (chatCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Chat not found" });
      }

      // Auto-update placeholder title if it's the first prompt
      if (chatCheck.rows[0].title === "New Conversation" && prompt) {
        const updatedTitle = prompt.slice(0, 35) + (prompt.length > 35 ? "..." : "");
        await pool.query(
          `UPDATE vault_chats SET title = $1 WHERE id = $2`,
          [updatedTitle, chatId]
        );
      }
    }

    // Retrieve previous 6 messages for context
    const historyRes = await pool.query(
      `SELECT role, text FROM vault_messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT 6`,
      [chatId]
    );
    const conversationHistory = historyRes.rows.reverse();

    // Persist user prompt & attachment metadata
    const attachmentMeta = attachments.map((a) => ({ name: a.name, mimeType: a.mimeType }));
    await pool.query(
      `INSERT INTO vault_messages (chat_id, role, text, attachments) VALUES ($1, 'user', $2, $3)`,
      [chatId, prompt || "", JSON.stringify(attachmentMeta)]
    );

    // Query Gemini
    const aiResponse = await generateAuraResponse(prompt, mode, attachments, conversationHistory);

    // Persist assistant reply
    const savedAiMsg = await pool.query(
      `INSERT INTO vault_messages (chat_id, role, text, model_tier, is_failover) 
       VALUES ($1, 'assistant', $2, $3, $4) 
       RETURNING id, role, text, model_tier AS "modelTier", is_failover AS "isFailOver", created_at`,
      [chatId, aiResponse.text, aiResponse.modelUsed, aiResponse.isFailOver]
    );

    // Update timestamp
    await pool.query(
      `UPDATE vault_chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [chatId]
    );

    return res.status(200).json({
      success: true,
      chatId,
      token: createSignedChatToken(chatId, userId),
      isNewChat,
      assistantMessage: savedAiMsg.rows[0],
    });
  } catch (err) {
    console.error("Error in sendVaultMessage:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to process message" });
  }
};

// 5. Toggle pinned status
export const togglePinChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId: chatToken } = req.params;

    const chatId = verifySignedChatToken(chatToken, userId);
    if (!chatId) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Invalid or altered chat token.",
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
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    return res.status(200).json({ success: true, isPinned: result.rows[0].is_pinned });
  } catch (err) {
    console.error("Error toggling pin:", err);
    return res.status(500).json({ success: false, message: "Failed to update pin" });
  }
};

// 6. Delete conversation thread
export const deleteChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId: chatToken } = req.params;

    const chatId = verifySignedChatToken(chatToken, userId);
    if (!chatId) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Invalid or altered chat token.",
      });
    }

    const result = await pool.query(
      `DELETE FROM vault_chats WHERE id = $1 AND user_id = $2 RETURNING id`,
      [chatId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    return res.status(200).json({ success: true, message: "Chat deleted successfully" });
  } catch (err) {
    console.error("Error deleting chat:", err);
    return res.status(500).json({ success: false, message: "Failed to delete chat" });
  }
};

// 7. Direct AI response generation without session persistence
export const generateResponse = async (req, res) => {
  try {
    const { prompt, mode = "mini", attachments = [] } = req.body;
    const aiResponse = await generateAuraResponse(prompt, mode, attachments);
    return res.status(200).json({ success: true, response: aiResponse });
  } catch (err) {
    console.error("Error in generateResponse:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to generate response" });
  }
};

// 8. Analyze code snippets and stack traces
export const analyzeCode = async (req, res) => {
  try {
    const { codeBlock, stackTrace = "" } = req.body;
    const analysis = await analyzeSnippets(codeBlock, stackTrace);
    return res.status(200).json({ success: true, analysis });
  } catch (err) {
    console.error("Error in analyzeCode:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to analyze code" });
  }
};