import { Router } from 'express';
import {
  register,
  login,
  getMe,
  refreshToken,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validations/schemas.js';
import {
  authRateLimiter,
  verificationRateLimiter,
  passwordResetRateLimiter,
} from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, validateRequest(registerSchema), register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), login);
router.post('/verify-email', verificationRateLimiter, validateRequest(verifyEmailSchema), verifyEmail);
router.post('/resend-verification', verificationRateLimiter, validateRequest(resendVerificationSchema), resendVerification);
router.post('/forgot-password', passwordResetRateLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
router.get('/verify-reset-token', verifyResetToken);
router.post('/reset-password', passwordResetRateLimiter, validateRequest(resetPasswordSchema), resetPassword);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authMiddleware, getMe);

export default router;

