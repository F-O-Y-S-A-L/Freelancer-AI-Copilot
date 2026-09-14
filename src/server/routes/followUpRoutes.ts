import { Router } from 'express';
import {
  getFollowUps,
  generateFollowUp,
  scheduleFollowUp,
  snoozeFollowUp,
  dismissFollowUp,
  sendFollowUp,
} from '../controllers/followUpController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, getFollowUps);
router.post('/generate', authMiddleware, generateFollowUp);
router.post('/:id/schedule', authMiddleware, scheduleFollowUp);
router.post('/:id/snooze', authMiddleware, snoozeFollowUp);
router.post('/:id/dismiss', authMiddleware, dismissFollowUp);
router.post('/:id/send', authMiddleware, sendFollowUp);

export default router;
