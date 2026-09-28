import express from 'express';
import {
  generateResponse,
  analyzeCode,
  getUserChats,
  createNewChat,
  getChatMessages,
  sendVaultMessage,
  togglePinChat,
  deleteChat,
  updateChatTitle,
} from '../controllers/vaultController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Enforce authentication across all vault endpoints
router.use(requireAuth);

router.post('/generate', generateResponse);
router.post('/analyze', analyzeCode);
router.get('/chats', getUserChats);
router.post('/chats', createNewChat);
router.get('/chats/:chatId/messages', getChatMessages);
router.post('/chats/:chatId/messages', sendVaultMessage);
router.post('/message', sendVaultMessage);
router.patch('/chats/:chatId/title', updateChatTitle);
router.patch('/chats/:chatId/pin', togglePinChat);
router.delete('/chats/:chatId', deleteChat);

export default router;