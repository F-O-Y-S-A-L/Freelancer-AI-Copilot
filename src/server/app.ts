import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { securityHeadersMiddleware, noSqlSanitizerMiddleware } from './middleware/security.js';
import { requestLoggerMiddleware } from './utils/logger.js';
import { apiGeneralRateLimiter } from './middleware/rateLimiter.js';
import { getDbStatus } from './config/db.js';
import { ENV } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import usageRoutes from './routes/usageRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import followUpRoutes from './routes/followUpRoutes.js';
import { errorHandler } from './middleware/error.js';

// Lightweight zero-dependency cookie parser
function simpleCookieParser(req: Request, _res: Response, next: NextFunction): void {
  const cookieHeader = req.headers.cookie;
  (req as any).cookies = {};
  if (cookieHeader) {
    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
      const idx = pair.indexOf('=');
      if (idx > 0) {
        const key = pair.substring(0, idx).trim();
        const val = pair.substring(idx + 1).trim();
        try {
          (req as any).cookies[key] = decodeURIComponent(val);
        } catch {
          (req as any).cookies[key] = val;
        }
      }
    }
  }
  next();
}

export function createApp() {
  const app = express();

  // Security & Observability Middlewares
  app.use(securityHeadersMiddleware);
  app.use(requestLoggerMiddleware);

  // CORS configuration
  app.use(
    cors({
      origin: true, // Echo origin or specify domain
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body parsers with payload limits to prevent DOS
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  app.use(simpleCookieParser);

  // NoSQL injection defense
  app.use(noSqlSanitizerMiddleware);

  // Health and Readiness Check APIs
  app.get('/api/health', (_req: Request, res: Response) => {
    const dbStatus = getDbStatus();
    res.json({
      status: 'healthy',
      service: 'Freelancer AI Copilot Backend',
      version: '1.0.0',
      environment: ENV.NODE_ENV,
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/ready', (_req: Request, res: Response) => {
    const dbStatus = getDbStatus();
    if (dbStatus.connected) {
      res.json({ status: 'ready', database: dbStatus });
    } else {
      res.status(503).json({ status: 'not_ready', database: dbStatus });
    }
  });

  // Global rate limiter for API routes
  app.use('/api', apiGeneralRateLimiter);

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

