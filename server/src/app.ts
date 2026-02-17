import express from 'express';
import cors from 'cors';
import { listRoutes } from './routes/listRoutes.js';
import { taskRoutes } from './routes/taskRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const createApp = () => {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json());
  app.use('/api/lists', listRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use(errorHandler);
  return app;
};
