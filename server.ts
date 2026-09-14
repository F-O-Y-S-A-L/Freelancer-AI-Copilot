import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './src/server/app.js';
import { connectDB } from './src/server/config/db.js';
import { ENV } from './src/server/config/env.js';

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Freelancer Copilot Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
