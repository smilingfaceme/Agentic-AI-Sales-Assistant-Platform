import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';

import projectRoutes from './routes/project.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/api/project', projectRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
