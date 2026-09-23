import express from 'express';
import {
  generateResponse,
  analyzeCode,
  getUserChats,
  createNewChat,
  getChatMessages,
  sendVaultMessage,
  togglePinChat,
  deleteChat
} from '../controllers/vaultController.js';

const router = express.Router();

router.post('/generate', generateResponse);
router.post('/analyze', analyzeCode);
router.get('/chats', getUserChats);
router.post('/chats', createNewChat);
router.get('/chats/:chatId/messages', getChatMessages);
router.post('/chats/:chatId/messages', sendVaultMessage);
router.post('/message', sendVaultMessage);
router.patch('/chats/:chatId/pin', togglePinChat);
router.delete('/chats/:chatId', deleteChat);

export default router;