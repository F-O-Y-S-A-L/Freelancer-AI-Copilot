import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { updateProfileSchema } from '../validations/schemas.js';

const router = Router();

router.get('/', authMiddleware, getProfile);
router.put('/', authMiddleware, validateRequest(updateProfileSchema), updateProfile);

export default router;
