import express from 'express';
import { getChatHistoryByConversationId, sendMessagetoUserandBot} from '../controllers/chatController.js';
import checkToken from '../middleware/checkToken.js';

const router = express.Router();

// GET /chat/history?conversation_id=...
router.get('/history', checkToken, getChatHistoryByConversationId);

// POST /chat/send
router.post('/send', checkToken, sendMessagetoUserandBot);

export default router;