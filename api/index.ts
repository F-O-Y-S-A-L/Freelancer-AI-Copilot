import type { Request, Response } from 'express';
import { createApp } from '../src/server/app.js';

const app = createApp();

export default function handler(req: Request, res: Response) {
  const forwarded =
    (req.headers['x-forwarded-uri'] as string) ||
    (req.headers['x-matched-path'] as string) ||
    (req.headers['x-vercel-matched-path'] as string) ||
    '';
  const original = req.originalUrl || '';

  // If Vercel rewrote /api/(.*) to /api, restore the full path from headers or originalUrl
  if (req.url === '/api' || req.url === '/api/' || req.url === '/' || !req.url) {
    if (forwarded && forwarded.startsWith('/api') && forwarded !== '/api' && forwarded !== '/api/') {
      req.url = forwarded;
    } else if (original && original.startsWith('/api') && original !== '/api' && original !== '/api/') {
      req.url = original;
    }
  } else if (!req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }

  return app(req, res);
}

// Attach Express methods and properties to handler for full framework compatibility
Object.setPrototypeOf(handler, app);
Object.assign(handler, app);

export { handler as app };

