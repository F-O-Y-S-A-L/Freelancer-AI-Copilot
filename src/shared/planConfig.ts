export const FREE_PLAN_AI_CREDITS_LIMIT = 20;
export const FREE_PLAN_STORAGE_LIMIT_GB = 2;

export const PRO_PLAN_AI_CREDITS_LIMIT = 80;
export const PRO_PLAN_STORAGE_LIMIT_GB = 10;

export interface IPlanItem {
  id: 'free' | 'pro' | 'custom';
  name: string;
  badge?: string;
  tagline: string;
  priceFormatted: string;
  billingPeriod: string;
  creditsLimit?: number;
  storageGB?: number;
  features: string[];
  popular?: boolean;
}

export const APP_PLANS: IPlanItem[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Essential AI toolkit for freelance client messaging',
    priceFormatted: '$0',
    billingPeriod: 'Forever free',
    creditsLimit: FREE_PLAN_AI_CREDITS_LIMIT,
    storageGB: FREE_PLAN_STORAGE_LIMIT_GB,
    features: [
      '20 AI Reply Credits / month',
      '2 GB File Storage',
      'Screenshot OCR & inquiry extraction',
      'Up to 3 custom AI templates',
      'Standard follow-up reminders',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Popular',
    tagline: 'High-speed AI co-pilot for active freelance sellers',
    priceFormatted: '$19',
    billingPeriod: 'per month, billed annually',
    creditsLimit: PRO_PLAN_AI_CREDITS_LIMIT,
    storageGB: PRO_PLAN_STORAGE_LIMIT_GB,
    popular: true,
    features: [
      '80 AI Reply Credits / month',
      '10 GB High-Speed Storage',
      'Multimodal Gemini Flash vision & OCR',
      'Unlimited AI templates & custom rules',
      'Automated follow-up tracking & snooze',
      'Knowledge Base pricing & FAQ rules',
      'Conversion analytics & insights',
    ],
  },
  {
    id: 'custom',
    name: 'Custom',
    badge: 'Tailored',
    tagline: 'Tailored limits & capacity for high-volume freelancers',
    priceFormatted: 'Custom',
    billingPeriod: 'Tailored to your needs',
    features: [
      'Custom AI Reply Credits',
      'Custom File Storage capacity',
      'All Pro features & capabilities',
      'Custom persona & response tuning',
      'Priority processing throughput',
      'Dedicated workspace configuration',
    ],
  },
];
