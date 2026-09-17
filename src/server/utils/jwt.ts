import jwt, { SignOptions } from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  tokenType?: 'access' | 'refresh';
  tokenVersion?: number;
  jti?: string;
}

// In-memory token revocation registry (with auto-cleanup of expired hashes)
const revokedTokens = new Map<string, number>();

export function revokeToken(token: string, expiresAtEpochSeconds?: number): void {
  if (!token) return;
  const expiry = expiresAtEpochSeconds || Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
  revokedTokens.set(token, expiry);

  // Periodic cleanup of expired revocations
  const now = Math.floor(Date.now() / 1000);
  for (const [t, exp] of revokedTokens.entries()) {
    if (exp < now) {
      revokedTokens.delete(t);
    }
  }
}

export function isTokenRevoked(token: string): boolean {
  if (!token) return true;
  const exp = revokedTokens.get(token);
  if (!exp) return false;
  if (exp < Math.floor(Date.now() / 1000)) {
    revokedTokens.delete(token);
    return false;
  }
  return true;
}

export function signAccessToken(payload: JwtPayload): string {
  const jti = `acc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const signPayload = {
    ...payload,
    tokenType: 'access' as const,
    jti,
  };
  const options: SignOptions = {
    expiresIn: '1h',
  };
  return jwt.sign(signPayload, ENV.JWT_SECRET, options);
}

export function signRefreshToken(payload: JwtPayload): string {
  const jti = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const signPayload = {
    ...payload,
    tokenType: 'refresh' as const,
    jti,
  };
  const options: SignOptions = {
    expiresIn: '7d',
  };
  return jwt.sign(signPayload, ENV.JWT_SECRET, options);
}

export function signToken(payload: JwtPayload): string {
  let expiresIn = ENV.JWT_EXPIRES_IN;
  if (typeof expiresIn === 'string' && /^\d+$/.test(expiresIn)) {
    expiresIn = `${expiresIn}d`;
  }
  const options: SignOptions = {
    expiresIn: (expiresIn || '7d') as any,
  };
  return jwt.sign(payload, ENV.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  if (isTokenRevoked(token)) {
    throw new Error('Token has been revoked');
  }
  return jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  if (isTokenRevoked(token)) {
    throw new Error('Refresh token has been revoked');
  }
  const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
  if (decoded.tokenType && decoded.tokenType !== 'refresh') {
    throw new Error('Invalid token type for refresh operation');
  }
  return decoded;
}

