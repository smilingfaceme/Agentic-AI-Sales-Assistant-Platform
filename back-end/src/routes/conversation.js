import express from 'express';
import { getConversationsByProductId, getUnansweredQuestions } from '../controllers/conversationController.js';
import checkToken from '../middleware/checkToken.js';

const router = express.Router();
// GET /conversations?product_id=...
router.get('/', checkToken,getConversationsByProductId);

// GET /conversations/unanswered
router.get('/unanswered', checkToken, getUnansweredQuestions);
export default router;
