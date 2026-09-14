import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import usageRoutes from './routes/usageRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import followUpRoutes from './routes/followUpRoutes.js';
import { errorHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  // Core Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Freelancer AI Copilot Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/templates', templateRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/followups', followUpRoutes);
  app.use('/api/inquiries', inquiryRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/usage', usageRoutes);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
