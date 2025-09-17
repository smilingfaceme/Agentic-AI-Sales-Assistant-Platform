import express from 'express';
import { getConversationsByProductId } from '../controllers/conversationController.js';
import checkToken from '../middleware/checkToken.js';

const router = express.Router();
// GET /conversations?product_id=...
router.get('/', checkToken,getConversationsByProductId);

export default router;
