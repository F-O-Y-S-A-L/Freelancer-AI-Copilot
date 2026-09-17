export const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='none'><circle cx='32' cy='32' r='32' fill='%236D28D9'/><circle cx='32' cy='24' r='11' fill='%23FFFFFF'/><path d='M14 52C14 42 22 37 32 37C42 37 50 42 50 52' fill='%23FFFFFF'/></svg>";

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: 'freelancer' | 'admin';
  avatar?: string;
  aiCreditsRemaining?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IServiceItem {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  basePrice: number;
  currency: string;
  pricingModel: 'fixed' | 'hourly' | 'starting_at';
  deliveryDays?: number;
  deliverables?: string[];
}

export interface IPricingRule {
  minProjectPrice: number;
  maxProjectPrice?: number;
  hourlyRate?: number;
  rushOrderMultiplier?: number;
  currency: string;
}

export interface IUserProfile {
  id: string;
  _id?: string;
  userId: string;
  profession: string;
  professions?: string[];
  categories?: string[];
  specializations?: string[];
  experienceLevel: 'junior' | 'mid' | 'senior' | 'expert';
  bio?: string;
  avatar?: string;
  skills: string[];
  toolsAndFrameworks: string[];
  supportedWork: string[];
  unsupportedWork: string[];
  services: IServiceItem[];
  pricingRules: IPricingRule;
  businessRules: string[];
  maxRevisions?: number;
  depositPercentage?: number;
  communicationTone: 'formal' | 'friendly' | 'concise' | 'detailed';
  followUpThresholdDays?: number;
  createdAt: string;
  updatedAt: string;
}

export type TemplateCategory =
  | 'First Response'
  | 'Follow-up'
  | 'Pricing'
  | 'Project Details'
  | 'Revision'
  | 'Delivery'
  | 'Thank You'
  | 'Custom';

export interface ITemplate {
  id: string;
  _id?: string;
  userId: string;
  title: string;
  description?: string;
  content: string;
  category: TemplateCategory | string;
  createdAt: string;
  updatedAt: string;
}

export interface IClient {
  id: string;
  userId: string;
  name: string;
  email?: string;
  company?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IInquiryBreakdownItem {
  item: string;
  price: number;
}

export interface IInquiryPricingEstimate {
  minPrice?: number;
  maxPrice?: number;
  deliveryDays?: number;
  currency?: string;
  breakdown?: IInquiryBreakdownItem[];
}

export interface IClientAttachment {
  id: string;
  type: 'image';
  data: string;
  mimeType: string;
  name?: string;
  createdAt: string;
}

export interface IConversationMessage {
  id: string;
  sender: 'client' | 'freelancer';
  type: 'text' | 'screenshot';
  text?: string;
  screenshotData?: string;
  screenshotMimeType?: string;
  fileName?: string;
  read?: boolean;
  createdAt: string;
}

export interface IAnalyzedScreenshot {
  fingerprint: string;
  fileName?: string;
  mimeType?: string;
  analysisResult: IInquiryAnalysis;
  extractedMessageText?: string;
  analyzedAt: string;
}

export interface IInquiryAnalysis {
  capability?: 'supported' | 'partially_supported' | 'not_supported';
  clientWants?: string[];
  requiredSkills?: string[];
  matchedSkills?: string[];
  missingSkills?: string[];
  questionsToClarify?: string[];
  pricingEstimate?: IInquiryPricingEstimate;
  aiSuggestedReply?: string;
  extractedMessageText?: string;
  analyzedAt?: string;
  scopeComplexity?: 'low' | 'medium' | 'high';
  currentScreenshotFingerprint?: string;
  translations?: {
    bn?: IInquiryAnalysis;
    [key: string]: any;
  };
}

export interface IInquiry {
  id: string;
  _id?: string;
  userId: string;
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  subject?: string;
  rawMessage: string;
  sourceChannel?: string;
  sourceType?: 'screenshot' | 'text';
  screenshotData?: string;
  screenshotMimeType?: string;
  clientAttachments?: IClientAttachment[];
  conversationHistory?: IConversationMessage[];
  extractedMessageText?: string;
  status: 'new' | 'analyzed' | 'replied' | 'converted' | 'declined' | 'archived';
  read?: boolean;
  readAt?: string;
  starred?: boolean;
  starredAt?: string;
  draft?: string;
  sentReply?: string;
  selectedTone?: 'friendly' | 'formal' | 'concise' | 'detailed';
  analysisResult?: IInquiryAnalysis;
  analysisHistory?: IInquiryAnalysis[];
  analyzedScreenshots?: IAnalyzedScreenshot[];
  createdAt: string;
  updatedAt: string;
}

export interface IAuthResponse {
  user: IUser;
  token: string;
  refreshToken?: string;
}

export interface IAnalyticsData {
  period: '7d' | '30d' | '90d' | 'year' | 'all' | 'custom';
  startDate?: string;
  endDate?: string;
  totalInquiries: number;
  repliedCount: number;
  pendingCount: number;
  responseRate: number;
  conversionRate: number;
  responseTime: {
    averageMinutes: number | null;
    fastestMinutes: number | null;
    slowestMinutes: number | null;
    hasReliableData: boolean;
    distribution: {
      under1h: number;
      between1hAnd6h: number;
      between6hAnd24h: number;
      over24h: number;
    };
  };
  inquiriesByStatus: {
    new: number;
    analyzed: number;
    replied: number;
    converted: number;
    declined: number;
    archived: number;
  };
  activityTimeline: Array<{
    date: string;
    label: string;
    inquiries: number;
    replies: number;
  }>;
  aiUsage: {
    analysesCompleted: number;
    repliesGenerated: number;
    templatesCount: number;
    aiAssistedReplyRate: number;
    remainingCredits: number;
    totalCredits: number;
    usedCredits: number;
    usagePercentage: number;
  };
  capabilityBreakdown: {
    supported: number;
    partially_supported: number;
    not_supported: number;
    unassigned: number;
  };
  pipelineValue: {
    totalMin: number;
    totalMax: number;
    currency: string;
  };
  aiCreditUsage: {
    remainingCredits: number;
    totalCredits: number;
    usedCredits: number;
    usagePercentage: number;
  };
  sourcePerformance: Array<{
    source: string;
    inquiries: number;
    replied: number;
    converted: number;
    responseRate: number;
    percentage: number;
  }>;
  channelDistribution: Array<{
    channel: string;
    count: number;
    percentage: number;
  }>;
}

export interface IUsageData {
  aiCreditsRemaining: number;
  totalCredits: number;
  usedCredits: number;
  usagePercentage: number;
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: unknown;
  aiCreditsRemaining?: number;
}

export type NotificationType =
  | 'new_inquiry'
  | 'client_replied'
  | 'ai_analysis_completed'
  | 'requires_reply'
  | 'followup_due';

export interface INotification {
  id: string;
  _id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  inquiryId?: string;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
}

export type FollowUpStatus = 'due' | 'scheduled' | 'completed' | 'dismissed' | 'snoozed';

export interface IFollowUp {
  id: string;
  _id?: string;
  userId: string;
  inquiryId: string;
  clientName: string;
  clientEmail?: string;
  subject?: string;
  sourceChannel?: string;
  status: FollowUpStatus;
  lastUserReplyAt: string;
  lastUserReplyText?: string;
  lastClientMessageText?: string;
  lastClientMessageAt?: string;
  dueAt: string;
  scheduledFor?: string;
  snoozedUntil?: string;
  completedAt?: string;
  dismissedAt?: string;
  generatedMessage?: string;
  sentMessage?: string;
  tone?: 'friendly' | 'formal' | 'concise' | 'detailed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IFollowUpSummary {
  dueCount: number;
  scheduledCount: number;
  completedCount: number;
  noResponseCount: number;
  totalActiveFollowUps: number;
}


