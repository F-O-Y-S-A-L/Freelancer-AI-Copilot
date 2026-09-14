import dotenv from 'dotenv';
dotenv.config();

const rawModel = process.env.GEMINI_MODEL;
// Ensure we use gemini-3.7-flash as default, mapping models with zero free-tier quota (like gemini-3.1-pro)
const isZeroQuotaModel = rawModel === 'gemini-3.1-pro' || rawModel === 'gemini-3.1-pro-preview';
const resolvedModel = (!rawModel || isZeroQuotaModel) ? 'gemini-3.7-flash' : rawModel;

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
  GEMINI_FALLBACK_MODEL: process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash',
};
