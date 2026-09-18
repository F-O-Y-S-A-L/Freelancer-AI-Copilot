import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try multiple candidate paths for .env and .env.production
const candidateDirs = [
  process.cwd(),
  path.resolve(process.cwd(), '..'),
  typeof __dirname !== 'undefined' ? __dirname : '',
  typeof __dirname !== 'undefined' ? path.resolve(__dirname, '..') : '',
].filter(Boolean);

// Load base environment configuration (.env)
dotenv.config();

// If in production, load .env.production with override: true so production secrets take precedence
if (process.env.NODE_ENV === 'production') {
  for (const dir of candidateDirs) {
    const prodEnvPath = path.resolve(dir, '.env.production');
    if (fs.existsSync(prodEnvPath)) {
      dotenv.config({ path: prodEnvPath, override: true });
      break;
    }
  }
}

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
    // Attempt explicit override from .env.production if present
    for (const dir of candidateDirs) {
      const prodEnvPath = path.resolve(dir, '.env.production');
      if (fs.existsSync(prodEnvPath)) {
        try {
          const prodConfig = dotenv.parse(fs.readFileSync(prodEnvPath, 'utf-8'));
          if (prodConfig.JWT_SECRET && prodConfig.JWT_SECRET.trim() !== '' && prodConfig.JWT_SECRET !== DEV_INSECURE_JWT_SECRET) {
            jwtSecret = prodConfig.JWT_SECRET.trim();
            process.env.JWT_SECRET = jwtSecret;
            break;
          }
        } catch {
          // ignore parse error
        }
      }
    }
  }

  // Strict production JWT_SECRET validation: must be defined, non-empty, and not the dev placeholder
  if (!jwtSecret || jwtSecret.trim() === '' || jwtSecret === DEV_INSECURE_JWT_SECRET) {
    throw new Error(
      'FATAL CONFIGURATION ERROR: JWT_SECRET must be explicitly defined in production and cannot use insecure default placeholders.'
    );
  }
} else {
  jwtSecret = jwtSecret || DEV_INSECURE_JWT_SECRET;
}

export const ENV = {
  PORT: 3000,
  NODE_ENV: nodeEnv,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/freelancer_copilot',
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: resolvedModel,
  GEMINI_FALLBACK_MODEL: resolvedFallback,
};
