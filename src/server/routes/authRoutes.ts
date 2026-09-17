import { Router } from 'express';
import { register, login, getMe, refreshToken, logout } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validations/schemas.js';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', authMiddleware, getMe);

export default router;

