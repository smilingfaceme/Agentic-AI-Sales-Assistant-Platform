
import express from 'express';
import { createProjectController, getProjectsByUserIdController } from '../controllers/projectController.js';
import checkToken from '../middleware/checkToken.js';

const router = express.Router();

// Create new Project (protected)
router.post('/create', checkToken, createProjectController);

// Get all Projects by user_id (protected)
router.get('/get', checkToken, getProjectsByUserIdController);

export default router;
