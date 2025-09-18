import express from 'express';
import multer from 'multer';
import { getFileListByProjectId, uploadFileByProjectId } from '../controllers/knowledgeController.js';
import checkToken from '../middleware/checkToken.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
});

// GET /knowledge/list?project_id=...
router.get('/list', checkToken, getFileListByProjectId);

// POST /knowledge/upload?project_id=...
router.post('/upload', checkToken, upload.single('file'), uploadFileByProjectId);

export default router;
