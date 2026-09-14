import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
  userEmail?: string;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication token missing or invalid format',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload: JwtPayload = verifyToken(token);
    req.userId = payload.userId;
    req.userRole = payload.role;
    req.userEmail = payload.email;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token',
    });
  }
}
