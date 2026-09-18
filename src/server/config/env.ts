import dotenv from 'dotenv';
dotenv.config();

const DEPRECATED_OR_UNAVAILABLE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-3.1-pro',
  'gemini-3.1-pro-preview',
];

const rawModel = (process.env.GEMINI_MODEL || '').trim();
const isDeprecatedPrimary = !rawModel || DEPRECATED_OR_UNAVAILABLE_MODELS.includes(rawModel);
const resolvedModel = isDeprecatedPrimary ? 'gemini-3.6-flash' : rawModel;

const rawFallback = (process.env.GEMINI_FALLBACK_MODEL || '').trim();
const isDeprecatedFallback = !rawFallback || DEPRECATED_OR_UNAVAILABLE_MODELS.includes(rawFallback);
const resolvedFallback = isDeprecatedFallback ? 'gemini-3.7-flash' : rawFallback;

const nodeEnv = process.env.NODE_ENV || 'development';
const DEV_INSECURE_JWT_SECRET = 'super-secret-jwt-key-change-in-production-12345';

let jwtSecret = process.env.JWT_SECRET;
if (nodeEnv === 'production') {
  if (!jwtSecret || jwtSecret.trim() === '' || jwtSecret === DEV_INSECURE_JWT_SECRET) {
    throw new Error(
      'FATAL CONFIGURATION ERROR: JWT_SECRET must be explicitly defined in production and cannot use insecure default placeholders.'
    );
  }
} else {
  jwtSecret = jwtSecret || DEV_INSECURE_JWT_SECRET;
}

export const ENV = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: nodeEnv,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/freelancer_copilot',
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: resolvedModel,
  GEMINI_FALLBACK_MODEL: resolvedFallback,
};
