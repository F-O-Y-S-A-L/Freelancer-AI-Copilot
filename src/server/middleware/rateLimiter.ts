import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyPrefix?: string;
}

// In-memory sliding window store
const rateLimitStores = new Map<string, Map<string, RateLimitRecord>>();

export function resetRateLimitStore(keyPrefix?: string): void {
  if (keyPrefix) {
    rateLimitStores.delete(keyPrefix);
  } else {
    rateLimitStores.clear();
  }
}

export function checkRateLimit(
  key: string,
  options: { windowMs: number; max: number; keyPrefix?: string }
): { allowed: boolean; remaining: number; resetTime: number } {
  const { windowMs, max, keyPrefix = 'general' } = options;
  if (!rateLimitStores.has(keyPrefix)) {
    rateLimitStores.set(keyPrefix, new Map<string, RateLimitRecord>());
  }
  const store = rateLimitStores.get(keyPrefix)!;
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now > existing.resetTime) {
    const resetTime = now + windowMs;
    store.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: max - 1, resetTime };
  }

  existing.count += 1;
  const remaining = Math.max(0, max - existing.count);
  return {
    allowed: existing.count <= max,
    remaining,
    resetTime: existing.resetTime,
  };
}


function getClientIdentifier(req: Request): string {
  const authReq = req as AuthenticatedRequest;
  if (authReq.userId) {
    return `user:${authReq.userId}`;
  }

  // Support forwarded IP
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message = 'Too many requests. Please try again later.', keyPrefix = 'general' } = options;

  if (!rateLimitStores.has(keyPrefix)) {
    rateLimitStores.set(keyPrefix, new Map<string, RateLimitRecord>());
  }
  const store = rateLimitStores.get(keyPrefix)!;

  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment, skip unless explicitly testing rate limits
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      next();
      return;
    }

    const key = getClientIdentifier(req);
    const now = Date.now();
    const existing = store.get(key);

    if (!existing || now > existing.resetTime) {
      const resetTime = now + windowMs;
      store.set(key, { count: 1, resetTime });
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', max - 1);
      res.setHeader('RateLimit-Reset', Math.ceil(resetTime / 1000));
      next();
      return;
    }

    existing.count += 1;
    const remaining = Math.max(0, max - existing.count);
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', Math.ceil(existing.resetTime / 1000));

    if (existing.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetTime - now) / 1000));
      res.setHeader('Retry-After', retryAfterSec);
      res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfter: retryAfterSec,
      });
      return;
    }

    next();
  };
}

// Pre-configured rate limiters for distinct threat vectors
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts
  keyPrefix: 'auth',
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
});

export const verificationRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts
  keyPrefix: 'verify',
  message: 'Too many verification attempts. Please wait 15 minutes before trying again.',
});

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  keyPrefix: 'pwd-reset',
  message: 'Too many password reset requests. Please wait 15 minutes before trying again.',
});

export const analysisRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 website analyses
  keyPrefix: 'analysis',
  message: 'Website analysis rate limit reached. Please wait before analyzing additional websites.',
});

export const aiRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 40, // 40 AI evaluations / intelligence prompts
  keyPrefix: 'ai',
  message: 'AI generation rate limit reached. Please wait a few minutes before submitting new requests.',
});

export const apiGeneralRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 300, // 300 general requests
  keyPrefix: 'api',
  message: 'API request limit exceeded. Please slow down your requests.',
});
