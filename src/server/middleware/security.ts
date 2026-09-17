import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env.js';

/**
 * Security headers middleware adding defense-in-depth HTTP response headers.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Cross-site scripting filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HSTS in production
  if (ENV.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Remove Express identification
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * Recursively sanitizes objects to prevent NoSQL query injection attacks (e.g. { $gt: "" }, { $ne: null }).
 */
export function sanitizeNoSql(input: any): any {
  if (input === null || typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeNoSql);
  }

  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    // Strip leading dollar signs or dots from keys to prevent operator injection
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    cleanObj[key] = sanitizeNoSql(value);
  }
  return cleanObj;
}

export const sanitizeObject = sanitizeNoSql;

/**
 * Middleware that strips dangerous NoSQL operator keys from req.body, req.query, and req.params.
 */
export function noSqlSanitizerMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeNoSql(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeNoSql(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeNoSql(req.params);
  }
  next();
}
