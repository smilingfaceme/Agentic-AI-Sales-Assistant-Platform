import express from 'express';
import { getDashboardData } from '../controllers/dashboardController.js';
import checkToken from '../middleware/checkToken.js';

const router = express.Router();

// Dashboard data (protected)
router.get('/', checkToken, getDashboardData);

export default router;
