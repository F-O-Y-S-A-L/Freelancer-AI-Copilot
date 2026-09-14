import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All notification routes strictly require authentication
router.use(authMiddleware);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.put('/:id/read', markAsRead);
router.post('/mark-all-read', markAllAsRead);
router.put('/mark-all-read', markAllAsRead);
router.patch('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);

export default router;
