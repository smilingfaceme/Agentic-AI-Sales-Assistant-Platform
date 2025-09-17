import express from 'express';
import { getChatHistoryByConversationId } from '../controllers/chatController.js';
import checkToken from '../middleware/checkToken.js';

const router = express.Router();

// GET /chat/history?conversation_id=...
router.get('/history', checkToken, getChatHistoryByConversationId);

export default router;