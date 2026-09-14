import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  avatar: z.string().optional(),
  profession: z.string().optional(),
  professions: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  experienceLevel: z.enum(['junior', 'mid', 'senior', 'expert']).optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  toolsAndFrameworks: z.array(z.string()).optional(),
  supportedWork: z.array(z.string()).optional(),
  unsupportedWork: z.array(z.string()).optional(),
  services: z
    .array(
      z.object({
        id: z.string().optional(),
        _id: z.string().optional(),
        name: z.string().min(1, 'Service name is required'),
        description: z.string().optional(),
        basePrice: z.number().nonnegative(),
        currency: z.string().default('USD'),
        pricingModel: z.enum(['fixed', 'hourly', 'starting_at']),
        deliveryDays: z.number().nonnegative().optional(),
        deliverables: z.array(z.string()).optional(),
      })
    )
    .optional(),
  pricingRules: z
    .object({
      minProjectPrice: z.number().nonnegative().optional(),
      maxProjectPrice: z.number().nonnegative().optional(),
      hourlyRate: z.number().nonnegative().optional(),
      rushOrderMultiplier: z.number().positive().optional(),
      currency: z.string().optional(),
    })
    .optional(),
  businessRules: z.array(z.string()).optional(),
  maxRevisions: z.number().nonnegative().optional(),
  depositPercentage: z.number().min(0).max(100).optional(),
  communicationTone: z.enum(['formal', 'friendly', 'concise', 'detailed']).optional(),
  followUpThresholdDays: z.number().int().min(1).max(30).optional(),
});

const baseInquirySchema = z.object({
  clientId: z.string().optional(),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email().optional().or(z.literal('')),
  subject: z.string().optional(),
  rawMessage: z.string().optional(),
  sourceChannel: z.string().optional(),
  sourceType: z.enum(['screenshot', 'text']).optional().default('text'),
  screenshotData: z.string().optional(),
  screenshotMimeType: z.string().optional(),
  extractedMessageText: z.string().optional(),
});

export const createInquirySchema = baseInquirySchema.refine(
  (data) => {
    if (data.sourceType === 'screenshot') {
      return Boolean(data.screenshotData && data.screenshotData.length > 0);
    }
    return Boolean(data.rawMessage && data.rawMessage.trim().length >= 3);
  },
  {
    message: 'Either a valid screenshot or raw message text (min 3 chars) is required.',
    path: ['rawMessage'],
  }
);

export const updateInquirySchema = baseInquirySchema.partial().extend({
  status: z.enum(['new', 'analyzed', 'replied', 'converted', 'declined', 'archived']).optional(),
  read: z.boolean().optional(),
  readAt: z.union([z.string(), z.date()]).optional(),
  draft: z.string().optional(),
  sentReply: z.string().optional(),
  selectedTone: z.enum(['friendly', 'formal', 'concise', 'detailed']).optional(),
  analysisResult: z.any().optional(),
  conversationHistory: z.array(z.any()).optional(),
});

export const createTemplateSchema = z.object({
  title: z.string().min(1, 'Template title is required').max(120),
  description: z.string().max(300).optional(),
  content: z.string().min(1, 'Template content is required'),
  category: z.string().min(1, 'Category is required'),
});

export const updateTemplateSchema = createTemplateSchema.partial();

