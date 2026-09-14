import { Router } from 'express';
import {
  getInquiries,
  createInquiry,
  getInquiryById,
  updateInquiry,
  deleteInquiry,
  analyzeInquiry,
  generateInquiryReply,
  markInquiryAsRead,
  translateInquiryAnalysis,
} from '../controllers/inquiryController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { createInquirySchema, updateInquirySchema } from '../validations/schemas.js';

const router = Router();

router.get('/', authMiddleware, getInquiries);
router.post('/', authMiddleware, validateRequest(createInquirySchema), createInquiry);
router.get('/:id', authMiddleware, getInquiryById);
router.put('/:id', authMiddleware, validateRequest(updateInquirySchema), updateInquiry);
router.patch('/:id/read', authMiddleware, markInquiryAsRead);
router.post('/:id/read', authMiddleware, markInquiryAsRead);
router.put('/:id/read', authMiddleware, markInquiryAsRead);
router.delete('/:id', authMiddleware, deleteInquiry);
router.post('/:id/analyze', authMiddleware, analyzeInquiry);
router.post('/:id/reply', authMiddleware, generateInquiryReply);
router.post('/:id/translate-analysis', authMiddleware, translateInquiryAnalysis);

export default router;
