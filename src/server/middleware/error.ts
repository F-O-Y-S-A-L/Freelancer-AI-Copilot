import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[SERVER ERROR]:', err?.message || err);

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

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected internal server error occurred';

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: ENV.NODE_ENV === 'development' ? err.stack : undefined,
  });
}
