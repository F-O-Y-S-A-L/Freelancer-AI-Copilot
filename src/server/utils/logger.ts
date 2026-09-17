import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'gemini_api_key',
  'jwt_secret',
  'secret',
  'apikey',
]);

export function redactSensitiveData(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = redactSensitiveData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const logger = {
  info: (message: string, meta?: any) => {
    if (ENV.NODE_ENV === 'test') return;
    const cleanMeta = meta ? redactSensitiveData(meta) : '';
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, cleanMeta ? JSON.stringify(cleanMeta) : '');
  },

  warn: (message: string, meta?: any) => {
    const cleanMeta = meta ? redactSensitiveData(meta) : '';
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, cleanMeta ? JSON.stringify(cleanMeta) : '');
  },

  error: (message: string, error?: any) => {
    let errDetail: any = '';
    if (error instanceof Error) {
      errDetail = {
        name: error.name,
        message: error.message,
        ...(ENV.NODE_ENV !== 'production' ? { stack: error.stack } : {}),
      };
    } else if (error) {
      errDetail = redactSensitiveData(error);
    }
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, errDetail ? JSON.stringify(errDetail) : '');
  },
};

/**
 * Request logging middleware tracking execution time and status code.
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Filter out health checks from noisy logs
    if (originalUrl === '/api/health' || originalUrl === '/api/ready') {
      return;
    }

    if (statusCode >= 500) {
      logger.error(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    } else if (statusCode >= 400) {
      logger.warn(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    } else {
      logger.info(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    }
  });

  next();
}
