import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './src/server/app.js';
import { connectDB, disconnectDB } from './src/server/config/db.js';
import { ENV } from './src/server/config/env.js';
import { logger } from './src/server/utils/logger.js';

async function startServer() {
  await connectDB();

  const app = createApp();
  const PORT = ENV.PORT || 3000;

  if (ENV.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`[Freelancer Copilot Server] running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown handling
  let isShuttingDown = false;
  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`Received ${signal}. Gracefully shutting down server...`);

    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await disconnectDB();
        logger.info('Database connections safely closed.');
      } catch (err) {
        logger.error('Error during database disconnection:', err);
      }
      process.exit(0);
    });

    // Force exit if cleanup takes longer than 10 seconds
    setTimeout(() => {
      logger.error('Graceful shutdown timeout exceeded. Forcing termination.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

