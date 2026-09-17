import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(`Error on ${req.method} ${req.url}: ${err?.message || err}`, err);

  if (err?.name === 'GeminiQuotaExhaustedError' || err?.code === 'GEMINI_QUOTA_EXHAUSTED') {
    res.status(429).json({
      success: false,
      error: 'GEMINI_QUOTA_EXHAUSTED',
      message:
        err.message ||
        'AI analysis cannot currently continue because the configured Gemini API quota has been exhausted. Please try again later or check your Gemini API plan.',
    });
    return;
  }

  if (err?.name === 'GeminiConfigError') {
    res.status(400).json({
      success: false,
      error: 'GEMINI_CONFIGURATION_ERROR',
      message: 'Gemini API key is missing or invalid in server environment.',
    });
    return;
  }

  if (err?.name === 'GeminiModelUnavailableError' || err?.code === 'GEMINI_MODEL_UNAVAILABLE') {
    res.status(503).json({
      success: false,
      error: 'GEMINI_MODEL_UNAVAILABLE',
      message: 'AI model service is temporarily unavailable. Please try again in a few moments.',
    });
    return;
  }

  const statusCode = Number(err.statusCode || err.status) || 500;
  // In production, mask generic 500 errors so internal database or library errors are not leaked
  const isProd = ENV.NODE_ENV === 'production';
  const clientMessage = isProd && statusCode >= 500
    ? 'An unexpected internal server error occurred. Please try again later.'
    : err.message || 'An unexpected internal server error occurred';

  res.status(statusCode).json({
    success: false,
    error: clientMessage,
    ...(ENV.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

