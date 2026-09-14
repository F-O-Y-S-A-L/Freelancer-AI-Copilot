import { Router } from 'express';
import {
  getTemplates,
  createTemplate,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from '../controllers/templateController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { createTemplateSchema, updateTemplateSchema } from '../validations/schemas.js';

const router = Router();

router.get('/', authMiddleware, getTemplates);
router.post('/', authMiddleware, validateRequest(createTemplateSchema), createTemplate);
router.get('/:id', authMiddleware, getTemplateById);
router.put('/:id', authMiddleware, validateRequest(updateTemplateSchema), updateTemplate);
router.delete('/:id', authMiddleware, deleteTemplate);

export default router;
