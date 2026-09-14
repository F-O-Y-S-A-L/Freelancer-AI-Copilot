export interface ICategoryTaxonomy {
  id: string;
  name: string;
  description: string;
  iconName?: string;
}

export interface IServiceTaxonomy {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  defaultDeliverables?: string[];
}

export interface IProfessionTaxonomy {
  id: string;
  categoryId: string;
  name: string;
  relevantServiceIds: string[];
  description?: string;
}

export interface IProfessionKnowledgeCatalog {
  professionId: string;
  professionName: string;
  coreSkills: string[];
  toolsAndFrameworks: string[];
  suggestedOutOfScope: string[];
}

export const MASTER_CATEGORIES: ICategoryTaxonomy[] = [
  {
    id: 'programming-tech',
    name: 'Programming & Tech',
    description: 'Web, mobile, desktop, backend, cloud, testing, and AI software engineering.',
    iconName: 'Code',
  },
  {
    id: 'design-creative',
    name: 'Design & Creative',
    description: 'UI/UX, branding, graphic design, illustration, 3D art, and visual communication.',
    iconName: 'Palette',
  },
  {
    id: 'video-animation',
    name: 'Video & Animation',
    description: 'Post-production, 2D/3D animation, motion graphics, video ads, and explainer videos.',
    iconName: 'Video',
  },
  {
    id: 'writing-translation',
    name: 'Writing & Translation',
    description: 'Copywriting, technical writing, SEO articles, translation, and proofreading.',
    iconName: 'FileText',
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing',
    description: 'SEO, social media growth, paid ad campaigns, email funnels, and marketing strategy.',
    iconName: 'TrendingUp',
  },
  {
    id: 'music-audio',
    name: 'Music & Audio',
    description: 'Voice-over, music production, mixing, mastering, podcast editing, and sound design.',
    iconName: 'Music',
  },
  {
    id: 'business-consulting',
    name: 'Business & Consulting',
    description: 'Virtual assistance, market research, financial modeling, and business plans.',
    iconName: 'Briefcase',
  },
  {
    id: 'data-ai',
    name: 'Data & AI',
    description: 'Data analytics, visualization dashboards, machine learning, and AI fine-tuning.',
    iconName: 'Database',
  },
  {
    id: 'photography',
    name: 'Photography',
    description: 'Product photography, high-end photo retouching, and image editing.',
    iconName: 'Camera',
  },
  {
    id: 'lifestyle-personal',
    name: 'Lifestyle & Personal',
    description: 'Online tutoring, career mentoring, life coaching, and fitness consulting.',
    iconName: 'Heart',
  },
];

export const MASTER_SERVICES: IServiceTaxonomy[] = [
  // Programming & Tech
  { id: 'srv-web-dev', categoryId: 'programming-tech', name: 'Website Development' },
  { id: 'srv-webapp-dev', categoryId: 'programming-tech', name: 'Web Application Development' },
  { id: 'srv-mobile-dev', categoryId: 'programming-tech', name: 'Mobile App Development' },
  { id: 'srv-wordpress-dev', categoryId: 'programming-tech', name: 'WordPress Development' },
  { id: 'srv-shopify-dev', categoryId: 'programming-tech', name: 'Shopify/E-commerce Development' },
  { id: 'srv-game-dev', categoryId: 'programming-tech', name: 'Game Development' },
  { id: 'srv-chatbot-dev', categoryId: 'programming-tech', name: 'Chatbot Development' },
  { id: 'srv-desktop-dev', categoryId: 'programming-tech', name: 'Desktop Application Development' },
  { id: 'srv-extension-dev', categoryId: 'programming-tech', name: 'Browser Extension/Plugin Development' },
  { id: 'srv-qa-testing', categoryId: 'programming-tech', name: 'QA & Software Testing' },
  { id: 'srv-devops-cloud', categoryId: 'programming-tech', name: 'DevOps & Cloud Engineering' },
  { id: 'srv-database-design', categoryId: 'programming-tech', name: 'Database Design & Administration' },
  { id: 'srv-blockchain-dev', categoryId: 'programming-tech', name: 'Blockchain & Cryptocurrency Development' },
  { id: 'srv-ai-integration', categoryId: 'programming-tech', name: 'AI Development & Integration' },
  { id: 'srv-cybersecurity', categoryId: 'programming-tech', name: 'Cybersecurity Services' },
  { id: 'srv-api-dev', categoryId: 'programming-tech', name: 'API Development & Integration' },
  { id: 'srv-software-arch', categoryId: 'programming-tech', name: 'Software Architecture & Consulting' },

  // Design & Creative
  { id: 'srv-logo-design', categoryId: 'design-creative', name: 'Logo Design' },
  { id: 'srv-brand-identity', categoryId: 'design-creative', name: 'Brand Identity Design' },
  { id: 'srv-ui-ux', categoryId: 'design-creative', name: 'UI/UX Design' },
  { id: 'srv-graphic-design', categoryId: 'design-creative', name: 'Graphic Design' },
  { id: 'srv-web-design', categoryId: 'design-creative', name: 'Web Design' },
  { id: 'srv-app-design', categoryId: 'design-creative', name: 'App Design' },
  { id: 'srv-illustration', categoryId: 'design-creative', name: 'Illustration' },
  { id: 'srv-packaging-design', categoryId: 'design-creative', name: 'Packaging Design' },
  { id: 'srv-book-cover', categoryId: 'design-creative', name: 'Book Cover Design' },
  { id: 'srv-presentation-design', categoryId: 'design-creative', name: 'Presentation Design' },
  { id: 'srv-nft-art', categoryId: 'design-creative', name: 'NFT/Digital Art' },
  { id: 'srv-print-design', categoryId: 'design-creative', name: 'Print Design' },
  { id: 'srv-3d-modeling', categoryId: 'design-creative', name: '3D Modeling & Rendering' },
  { id: 'srv-character-design', categoryId: 'design-creative', name: 'Character Design' },
  { id: 'srv-merch-design', categoryId: 'design-creative', name: 'T-shirt/Merchandise Design' },

  // Video & Animation
  { id: 'srv-video-editing', categoryId: 'video-animation', name: 'Video Editing' },
  { id: 'srv-animation', categoryId: 'video-animation', name: 'Animation' },
  { id: 'srv-whiteboard-video', categoryId: 'video-animation', name: 'Whiteboard/Explainer Videos' },
  { id: 'srv-motion-graphics', categoryId: 'video-animation', name: 'Motion Graphics' },
  { id: 'srv-video-ads', categoryId: 'video-animation', name: 'Video Ads/Commercials' },
  { id: 'srv-intro-outro', categoryId: 'video-animation', name: 'Intro/Outro Videos' },
  { id: 'srv-video-prod', categoryId: 'video-animation', name: 'Video Production' },
  { id: 'srv-subtitles', categoryId: 'video-animation', name: 'Subtitles & Captions' },

  // Writing & Translation
  { id: 'srv-content-writing', categoryId: 'writing-translation', name: 'Content Writing' },
  { id: 'srv-copywriting', categoryId: 'writing-translation', name: 'Copywriting' },
  { id: 'srv-blog-writing', categoryId: 'writing-translation', name: 'Blog Writing' },
  { id: 'srv-technical-writing', categoryId: 'writing-translation', name: 'Technical Writing' },
  { id: 'srv-resume-writing', categoryId: 'writing-translation', name: 'Resume/CV Writing' },
  { id: 'srv-ghostwriting', categoryId: 'writing-translation', name: 'Ghostwriting' },
  { id: 'srv-translation', categoryId: 'writing-translation', name: 'Translation' },
  { id: 'srv-proofreading', categoryId: 'writing-translation', name: 'Proofreading & Editing' },
  { id: 'srv-book-writing', categoryId: 'writing-translation', name: 'Book/eBook Writing' },
  { id: 'srv-scriptwriting', categoryId: 'writing-translation', name: 'Scriptwriting' },

  // Digital Marketing
  { id: 'srv-seo', categoryId: 'digital-marketing', name: 'SEO' },
  { id: 'srv-social-marketing', categoryId: 'digital-marketing', name: 'Social Media Marketing' },
  { id: 'srv-social-management', categoryId: 'digital-marketing', name: 'Social Media Management' },
  { id: 'srv-content-marketing', categoryId: 'digital-marketing', name: 'Content Marketing' },
  { id: 'srv-email-marketing', categoryId: 'digital-marketing', name: 'Email Marketing' },
  { id: 'srv-ppc-ads', categoryId: 'digital-marketing', name: 'PPC/Google Ads' },
  { id: 'srv-meta-ads', categoryId: 'digital-marketing', name: 'Facebook/Instagram Ads' },
  { id: 'srv-influencer-marketing', categoryId: 'digital-marketing', name: 'Influencer Marketing' },
  { id: 'srv-marketing-strategy', categoryId: 'digital-marketing', name: 'Marketing Strategy' },
  { id: 'srv-affiliate-marketing', categoryId: 'digital-marketing', name: 'Affiliate Marketing' },
  { id: 'srv-aso', categoryId: 'digital-marketing', name: 'App Store Optimization' },

  // Music & Audio
  { id: 'srv-voice-over', categoryId: 'music-audio', name: 'Voice Over' },
  { id: 'srv-music-production', categoryId: 'music-audio', name: 'Music Production' },
  { id: 'srv-mixing-mastering', categoryId: 'music-audio', name: 'Mixing & Mastering' },
  { id: 'srv-podcast-editing', categoryId: 'music-audio', name: 'Podcast Editing' },
  { id: 'srv-jingles-intros', categoryId: 'music-audio', name: 'Jingles & Intros' },
  { id: 'srv-sound-design', categoryId: 'music-audio', name: 'Sound Design' },

  // Business & Consulting
  { id: 'srv-virtual-assistance', categoryId: 'business-consulting', name: 'Virtual Assistance' },
  { id: 'srv-data-entry', categoryId: 'business-consulting', name: 'Data Entry' },
  { id: 'srv-market-research', categoryId: 'business-consulting', name: 'Market Research' },
  { id: 'srv-business-plan', categoryId: 'business-consulting', name: 'Business Plan Writing' },
  { id: 'srv-financial-consulting', categoryId: 'business-consulting', name: 'Financial Consulting/Analysis' },
  { id: 'srv-accounting', categoryId: 'business-consulting', name: 'Accounting & Bookkeeping' },
  { id: 'srv-legal-consulting', categoryId: 'business-consulting', name: 'Legal Consulting' },
  { id: 'srv-hr-consulting', categoryId: 'business-consulting', name: 'HR Consulting' },
  { id: 'srv-project-management', categoryId: 'business-consulting', name: 'Project Management' },
  { id: 'srv-business-analysis', categoryId: 'business-consulting', name: 'Business Analysis' },

  // Data & AI
  { id: 'srv-data-analysis', categoryId: 'data-ai', name: 'Data Analysis' },
  { id: 'srv-data-visualization', categoryId: 'data-ai', name: 'Data Visualization' },
  { id: 'srv-data-science', categoryId: 'data-ai', name: 'Data Science' },
  { id: 'srv-machine-learning', categoryId: 'data-ai', name: 'Machine Learning' },
  { id: 'srv-ai-training', categoryId: 'data-ai', name: 'AI Model Training/Fine-tuning' },
  { id: 'srv-data-scraping', categoryId: 'data-ai', name: 'Data Scraping' },

  // Photography
  { id: 'srv-product-photo', categoryId: 'photography', name: 'Product Photography' },
  { id: 'srv-photo-editing', categoryId: 'photography', name: 'Photo Editing' },
  { id: 'srv-photo-retouching', categoryId: 'photography', name: 'Photo Retouching' },

  // Lifestyle & Personal
  { id: 'srv-online-tutoring', categoryId: 'lifestyle-personal', name: 'Online Tutoring' },
  { id: 'srv-career-coaching', categoryId: 'lifestyle-personal', name: 'Career Coaching' },
  { id: 'srv-life-coaching', categoryId: 'lifestyle-personal', name: 'Life Coaching' },
  { id: 'srv-fitness-training', categoryId: 'lifestyle-personal', name: 'Fitness Training' },
  { id: 'srv-astrology-reading', categoryId: 'lifestyle-personal', name: 'Astrology/Tarot Reading' },
];

export const MASTER_PROFESSIONS: IProfessionTaxonomy[] = [
  // Programming & Tech
  {
    id: 'prof-fullstack-dev',
    categoryId: 'programming-tech',
    name: 'Full-Stack Developer',
    relevantServiceIds: ['srv-web-dev', 'srv-webapp-dev', 'srv-api-dev', 'srv-database-design'],
  },
  {
    id: 'prof-frontend-dev',
    categoryId: 'programming-tech',
    name: 'Frontend Developer',
    relevantServiceIds: ['srv-web-dev', 'srv-webapp-dev'],
  },
  {
    id: 'prof-backend-dev',
    categoryId: 'programming-tech',
    name: 'Backend Developer',
    relevantServiceIds: ['srv-webapp-dev', 'srv-api-dev', 'srv-database-design'],
  },
  {
    id: 'prof-web-dev',
    categoryId: 'programming-tech',
    name: 'Web Developer',
    relevantServiceIds: ['srv-web-dev', 'srv-webapp-dev'],
  },
  {
    id: 'prof-mobile-dev',
    categoryId: 'programming-tech',
    name: 'Mobile App Developer',
    relevantServiceIds: ['srv-mobile-dev'],
  },
  {
    id: 'prof-ios-dev',
    categoryId: 'programming-tech',
    name: 'iOS Developer',
    relevantServiceIds: ['srv-mobile-dev'],
  },
  {
    id: 'prof-android-dev',
    categoryId: 'programming-tech',
    name: 'Android Developer',
    relevantServiceIds: ['srv-mobile-dev'],
  },
  {
    id: 'prof-react-native-dev',
    categoryId: 'programming-tech',
    name: 'React Native Developer',
    relevantServiceIds: ['srv-mobile-dev'],
  },
  {
    id: 'prof-flutter-dev',
    categoryId: 'programming-tech',
    name: 'Flutter Developer',
    relevantServiceIds: ['srv-mobile-dev'],
  },
  {
    id: 'prof-wordpress-dev',
    categoryId: 'programming-tech',
    name: 'WordPress Developer',
    relevantServiceIds: ['srv-wordpress-dev', 'srv-web-dev'],
  },
  {
    id: 'prof-shopify-dev',
    categoryId: 'programming-tech',
    name: 'Shopify Developer',
    relevantServiceIds: ['srv-shopify-dev', 'srv-web-dev'],
  },
  {
    id: 'prof-game-dev',
    categoryId: 'programming-tech',
    name: 'Game Developer',
    relevantServiceIds: ['srv-game-dev'],
  },
  {
    id: 'prof-qa-engineer',
    categoryId: 'programming-tech',
    name: 'QA / Test Automation Engineer',
    relevantServiceIds: ['srv-qa-testing'],
  },
  {
    id: 'prof-devops-engineer',
    categoryId: 'programming-tech',
    name: 'DevOps & Cloud Engineer',
    relevantServiceIds: ['srv-devops-cloud'],
  },
  {
    id: 'prof-blockchain-dev',
    categoryId: 'programming-tech',
    name: 'Blockchain Developer',
    relevantServiceIds: ['srv-blockchain-dev'],
  },
  {
    id: 'prof-ai-engineer',
    categoryId: 'programming-tech',
    name: 'AI / Machine Learning Engineer',
    relevantServiceIds: ['srv-ai-integration'],
  },
  {
    id: 'prof-cybersecurity-specialist',
    categoryId: 'programming-tech',
    name: 'Cybersecurity Specialist',
    relevantServiceIds: ['srv-cybersecurity'],
  },
  {
    id: 'prof-database-admin',
    categoryId: 'programming-tech',
    name: 'Database Administrator',
    relevantServiceIds: ['srv-database-design'],
  },
  {
    id: 'prof-software-architect',
    categoryId: 'programming-tech',
    name: 'Software Architect',
    relevantServiceIds: ['srv-software-arch', 'srv-webapp-dev'],
  },

  // Design & Creative
  {
    id: 'prof-ui-ux-designer',
    categoryId: 'design-creative',
    name: 'UI/UX Designer',
    relevantServiceIds: ['srv-ui-ux', 'srv-web-design', 'srv-app-design'],
  },
  {
    id: 'prof-brand-identity-designer',
    categoryId: 'design-creative',
    name: 'Brand Identity Designer',
    relevantServiceIds: ['srv-brand-identity', 'srv-logo-design'],
  },
  {
    id: 'prof-graphic-designer',
    categoryId: 'design-creative',
    name: 'Graphic Designer',
    relevantServiceIds: ['srv-graphic-design', 'srv-print-design', 'srv-presentation-design'],
  },
  {
    id: 'prof-illustrator',
    categoryId: 'design-creative',
    name: 'Illustrator & Digital Artist',
    relevantServiceIds: ['srv-illustration', 'srv-character-design', 'srv-nft-art'],
  },
  {
    id: 'prof-3d-artist',
    categoryId: 'design-creative',
    name: '3D Artist & Modeler',
    relevantServiceIds: ['srv-3d-modeling', 'srv-character-design'],
  },
  {
    id: 'prof-packaging-designer',
    categoryId: 'design-creative',
    name: 'Packaging & Print Designer',
    relevantServiceIds: ['srv-packaging-design', 'srv-print-design', 'srv-book-cover'],
  },

  // Video & Animation
  {
    id: 'prof-video-editor',
    categoryId: 'video-animation',
    name: 'Video Editor',
    relevantServiceIds: ['srv-video-editing', 'srv-video-ads', 'srv-subtitles'],
  },
  {
    id: 'prof-motion-graphics-designer',
    categoryId: 'video-animation',
    name: 'Motion Graphics Designer',
    relevantServiceIds: ['srv-motion-graphics', 'srv-intro-outro', 'srv-animation'],
  },
  {
    id: 'prof-animator',
    categoryId: 'video-animation',
    name: '2D/3D Animator',
    relevantServiceIds: ['srv-animation', 'srv-whiteboard-video'],
  },

  // Writing & Translation
  {
    id: 'prof-content-writer',
    categoryId: 'writing-translation',
    name: 'Content Writer',
    relevantServiceIds: ['srv-content-writing', 'srv-blog-writing', 'srv-ghostwriting'],
  },
  {
    id: 'prof-copywriter',
    categoryId: 'writing-translation',
    name: 'Copywriter',
    relevantServiceIds: ['srv-copywriting', 'srv-content-writing'],
  },
  {
    id: 'prof-technical-writer',
    categoryId: 'writing-translation',
    name: 'Technical Writer',
    relevantServiceIds: ['srv-technical-writing', 'srv-proofreading'],
  },
  {
    id: 'prof-translator',
    categoryId: 'writing-translation',
    name: 'Translator',
    relevantServiceIds: ['srv-translation', 'srv-proofreading'],
  },
  {
    id: 'prof-resume-writer',
    categoryId: 'writing-translation',
    name: 'Resume & Career Document Specialist',
    relevantServiceIds: ['srv-resume-writing'],
  },

  // Digital Marketing
  {
    id: 'prof-seo-specialist',
    categoryId: 'digital-marketing',
    name: 'SEO Specialist',
    relevantServiceIds: ['srv-seo', 'srv-content-marketing', 'srv-aso'],
  },
  {
    id: 'prof-social-media-manager',
    categoryId: 'digital-marketing',
    name: 'Social Media Manager',
    relevantServiceIds: ['srv-social-marketing', 'srv-social-management'],
  },
  {
    id: 'prof-media-buyer',
    categoryId: 'digital-marketing',
    name: 'PPC & Paid Ads Specialist',
    relevantServiceIds: ['srv-ppc-ads', 'srv-meta-ads'],
  },
  {
    id: 'prof-email-marketer',
    categoryId: 'digital-marketing',
    name: 'Email Marketing Specialist',
    relevantServiceIds: ['srv-email-marketing', 'srv-content-marketing'],
  },

  // Music & Audio
  {
    id: 'prof-voice-artist',
    categoryId: 'music-audio',
    name: 'Voice Over Artist',
    relevantServiceIds: ['srv-voice-over', 'srv-podcast-editing'],
  },
  {
    id: 'prof-music-producer',
    categoryId: 'music-audio',
    name: 'Music Producer & Composer',
    relevantServiceIds: ['srv-music-production', 'srv-jingles-intros'],
  },
  {
    id: 'prof-audio-engineer',
    categoryId: 'music-audio',
    name: 'Audio Engineer & Sound Designer',
    relevantServiceIds: ['srv-mixing-mastering', 'srv-sound-design', 'srv-podcast-editing'],
  },

  // Business & Consulting
  {
    id: 'prof-virtual-assistant',
    categoryId: 'business-consulting',
    name: 'Virtual Assistant',
    relevantServiceIds: ['srv-virtual-assistance', 'srv-data-entry', 'srv-project-management'],
  },
  {
    id: 'prof-financial-analyst',
    categoryId: 'business-consulting',
    name: 'Financial Consultant / Analyst',
    relevantServiceIds: ['srv-financial-consulting', 'srv-accounting'],
  },
  {
    id: 'prof-business-consultant',
    categoryId: 'business-consulting',
    name: 'Business Plan Consultant',
    relevantServiceIds: ['srv-business-plan', 'srv-market-research', 'srv-business-analysis'],
  },

  // Data & AI
  {
    id: 'prof-data-analyst',
    categoryId: 'data-ai',
    name: 'Data Analyst',
    relevantServiceIds: ['srv-data-analysis', 'srv-data-visualization'],
  },
  {
    id: 'prof-data-scientist',
    categoryId: 'data-ai',
    name: 'Data Scientist',
    relevantServiceIds: ['srv-data-science', 'srv-machine-learning', 'srv-data-analysis'],
  },
  {
    id: 'prof-data-engineer',
    categoryId: 'data-ai',
    name: 'Data Engineer / Web Scraper',
    relevantServiceIds: ['srv-data-scraping', 'srv-data-analysis'],
  },

  // Photography
  {
    id: 'prof-product-photographer',
    categoryId: 'photography',
    name: 'Product Photographer',
    relevantServiceIds: ['srv-product-photo', 'srv-photo-editing'],
  },
  {
    id: 'prof-photo-retoucher',
    categoryId: 'photography',
    name: 'Photo Editor & Retoucher',
    relevantServiceIds: ['srv-photo-editing', 'srv-photo-retouching'],
  },

  // Lifestyle & Personal
  {
    id: 'prof-online-tutor',
    categoryId: 'lifestyle-personal',
    name: 'Online Tutor / Instructor',
    relevantServiceIds: ['srv-online-tutoring'],
  },
  {
    id: 'prof-career-coach',
    categoryId: 'lifestyle-personal',
    name: 'Career & Interview Coach',
    relevantServiceIds: ['srv-career-coaching'],
  },
  {
    id: 'prof-life-coach',
    categoryId: 'lifestyle-personal',
    name: 'Life & Wellness Coach',
    relevantServiceIds: ['srv-life-coaching', 'srv-fitness-training'],
  },
];

export const PROFESSION_KNOWLEDGE_CATALOGS: Record<string, IProfessionKnowledgeCatalog> = {
  // Programming & Tech
  'Full-Stack Developer': {
    professionId: 'prof-fullstack-dev',
    professionName: 'Full-Stack Developer',
    coreSkills: [
      'JavaScript',
      'TypeScript',
      'Frontend Development',
      'Backend Development',
      'REST API',
      'GraphQL',
      'Authentication',
      'Database Integration',
      'Responsive Web Development',
      'Web Application Development',
      'State Management',
      'Server-Side Rendering',
      'Microservices',
      'Payment Gateway Integration',
      'OAuth & Security',
      'Performance Optimization',
      'HTML5/CSS3',
      'Async Programming',
      'JSON Web Tokens (JWT)',
      'CRUD Operations',
    ],
    toolsAndFrameworks: [
      'React',
      'Node.js',
      'Express',
      'Next.js',
      'Vue.js',
      'Nuxt',
      'Angular',
      'TypeScript',
      'Tailwind CSS',
      'MongoDB',
      'PostgreSQL',
      'MySQL',
      'Redis',
      'Prisma',
      'Mongoose',
      'Vite',
      'Git',
      'GitHub',
      'Docker',
      'Postman',
      'Stripe SDK',
      'Firebase',
      'Vercel',
      'AWS S3',
    ],
    suggestedOutOfScope: [
      'Mobile App Development',
      'iOS / Android Native Development',
      'WordPress Development',
      'Shopify Theme Development',
      'Game Development (Unity/Unreal)',
      'Desktop Software Development (C++/WPF)',
      'QA Manual & Load Testing',
      'DevOps Kubernetes Cluster Administration',
      'Blockchain Smart Contract Auditing',
      'Cybersecurity Penetration Testing',
      'Custom AI Model Training from Scratch',
      'Hardware Firmware Development',
    ],
  },
  'Frontend Developer': {
    professionId: 'prof-frontend-dev',
    professionName: 'Frontend Developer',
    coreSkills: [
      'JavaScript',
      'TypeScript',
      'HTML5/CSS3',
      'Frontend Architecture',
      'Responsive Design',
      'State Management',
      'Single Page Applications (SPA)',
      'DOM Manipulation',
      'API Consumption (REST/GraphQL)',
      'UI Component Design',
      'Cross-Browser Compatibility',
      'Web Performance & Core Web Vitals',
      'Accessibility (a11y)',
      'CSS Animations',
    ],
    toolsAndFrameworks: [
      'React',
      'Vue.js',
      'Next.js',
      'Angular',
      'Svelte',
      'Tailwind CSS',
      'Bootstrap',
      'Sass/SCSS',
      'Redux Toolkit',
      'Zustand',
      'TanStack Query',
      'Vite',
      'Webpack',
      'Git',
      'Figma to Code',
    ],
    suggestedOutOfScope: [
      'Backend Server Architecture',
      'Database Schema Migration & Administration',
      'DevOps Server Infrastructure',
      'Mobile Native App Development',
      'Game Engine Development',
      'Cybersecurity Auditing',
    ],
  },
  'Backend Developer': {
    professionId: 'prof-backend-dev',
    professionName: 'Backend Developer',
    coreSkills: [
      'Backend Architecture',
      'REST API Design',
      'GraphQL API',
      'Database Schema Design',
      'Authentication & Authorization',
      'Data Modeling',
      'Microservices',
      'Caching & Performance',
      'Message Queues',
      'Payment Processing',
      'Server-Side Security',
      'Data Validation',
      'Background Jobs & Cron',
    ],
    toolsAndFrameworks: [
      'Node.js',
      'Express',
      'NestJS',
      'Python',
      'Django',
      'FastAPI',
      'PostgreSQL',
      'MongoDB',
      'MySQL',
      'Redis',
      'Prisma',
      'Mongoose',
      'Docker',
      'RabbitMQ',
      'Kafka',
      'JWT',
      'Postman',
      'AWS Lambda',
    ],
    suggestedOutOfScope: [
      'Frontend UI/UX Design',
      'Figma Graphic Design',
      'CSS Animations & Layouts',
      'Mobile Native App UI',
      'Game Development',
    ],
  },
  'Web Developer': {
    professionId: 'prof-web-dev',
    professionName: 'Web Developer',
    coreSkills: [
      'HTML5',
      'CSS3',
      'JavaScript',
      'Responsive Web Design',
      'Landing Page Development',
      'Website Maintenance',
      'Cross-Browser Testing',
      'SEO Basics & Metadata',
      'Contact Forms & Lead Capture',
      'Web Performance Optimization',
    ],
    toolsAndFrameworks: [
      'React',
      'HTML/CSS/JS',
      'Tailwind CSS',
      'Bootstrap',
      'WordPress',
      'Vite',
      'Git',
      'Netlify',
      'Vercel',
      'cPanel',
    ],
    suggestedOutOfScope: [
      'Native Mobile iOS/Android Development',
      'Complex Microservices Architecture',
      '3D Game Engine Development',
      'Enterprise Cybersecurity Audits',
    ],
  },
  'Mobile App Developer': {
    professionId: 'prof-mobile-dev',
    professionName: 'Mobile App Developer',
    coreSkills: [
      'Mobile UI/UX Implementation',
      'Cross-Platform App Development',
      'Native API Integration (Camera, GPS, Storage)',
      'Push Notifications',
      'App Store & Play Store Deployment',
      'Mobile State Management',
      'Offline Storage & Sync',
      'Mobile Performance Optimization',
      'Deep Linking',
      'In-App Purchases',
    ],
    toolsAndFrameworks: [
      'React Native',
      'Flutter',
      'Expo',
      'Swift',
      'Kotlin',
      'Dart',
      'TypeScript',
      'Firebase Mobile SDK',
      'SQLite / WatermelonDB',
      'Xcode',
      'Android Studio',
      'Fastlane',
    ],
    suggestedOutOfScope: [
      'Desktop Software Development',
      'Enterprise Server Infrastructure',
      'WordPress Theme Development',
      '3D Unity Game Programming',
    ],
  },
  'React Native Developer': {
    professionId: 'prof-react-native-dev',
    professionName: 'React Native Developer',
    coreSkills: [
      'React Native',
      'JavaScript / TypeScript',
      'Expo Ecosystem',
      'Native Bridge & Modules',
      'Mobile State Management',
      'Push Notifications',
      'App Store Submission',
      'Google Play Submission',
      'Mobile Navigation',
      'Responsive Mobile UI',
    ],
    toolsAndFrameworks: [
      'React Native',
      'Expo',
      'React Navigation',
      'Redux / Zustand',
      'AsyncStorage',
      'Firebase',
      'Xcode',
      'Android Studio',
      'TypeScript',
      'Flipper',
    ],
    suggestedOutOfScope: [
      'Native Swift/Obj-C Exclusive Frameworks',
      'Web Backend Database Administration',
      'WordPress Development',
      'Game Development',
    ],
  },
  'Flutter Developer': {
    professionId: 'prof-flutter-dev',
    professionName: 'Flutter Developer',
    coreSkills: [
      'Flutter Widget Architecture',
      'Dart Programming',
      'Cross-Platform UI Rendering',
      'State Management (Bloc/Provider/Riverpod)',
      'Native Device Features Integration',
      'REST API Integration',
      'App Store & Play Store Release',
      'Animations in Flutter',
    ],
    toolsAndFrameworks: [
      'Flutter',
      'Dart',
      'Bloc',
      'Riverpod',
      'Provider',
      'Firebase',
      'Hive / SQLite',
      'Android Studio',
      'Xcode',
      'Git',
    ],
    suggestedOutOfScope: [
      'Web Server Backend Engineering',
      'WordPress Plugin Coding',
      '3D Game Engine Development',
    ],
  },
  'iOS Developer': {
    professionId: 'prof-ios-dev',
    professionName: 'iOS Developer',
    coreSkills: [
      'iOS App Development',
      'Swift Programming',
      'SwiftUI & UIKit',
      'Apple Design Guidelines (HIG)',
      'CoreData & SwiftData',
      'App Store Connect & TestFlight',
      'Combine / Async Swift',
      'CocoaPods & Swift Package Manager',
    ],
    toolsAndFrameworks: [
      'Swift',
      'SwiftUI',
      'UIKit',
      'Xcode',
      'CoreData',
      'TestFlight',
      'App Store Connect',
      'CocoaPods',
      'SPM',
    ],
    suggestedOutOfScope: [
      'Android Native Java/Kotlin Development',
      'PHP / WordPress Coding',
      'Server Cloud DevOps Management',
    ],
  },
  'Android Developer': {
    professionId: 'prof-android-dev',
    professionName: 'Android Developer',
    coreSkills: [
      'Android App Development',
      'Kotlin Programming',
      'Jetpack Compose',
      'Material Design 3',
      'Room Database & Coroutines',
      'Google Play Console Deployment',
      'Android Architecture Components (MVVM)',
      'Retrofit & OkHttp',
    ],
    toolsAndFrameworks: [
      'Kotlin',
      'Jetpack Compose',
      'Android Studio',
      'Room',
      'Coroutines & Flow',
      'Retrofit',
      'Hilt / Dagger',
      'Gradle',
      'Google Play Console',
    ],
    suggestedOutOfScope: [
      'iOS Swift Native Development',
      'Web Backend Server Infrastructure',
      'WordPress Custom Themes',
    ],
  },
  'WordPress Developer': {
    professionId: 'prof-wordpress-dev',
    professionName: 'WordPress Developer',
    coreSkills: [
      'WordPress Theme Customization',
      'Custom Plugin Development',
      'WooCommerce Store Setup',
      'Elementor / Gutenberg Page Building',
      'PHP & MySQL for WP',
      'Site Migration & Backup',
      'WordPress Speed & Security Optimization',
      'ACF (Advanced Custom Fields)',
    ],
    toolsAndFrameworks: [
      'WordPress',
      'WooCommerce',
      'Elementor',
      'Gutenberg',
      'PHP',
      'MySQL',
      'ACF Pro',
      'WP Rocket',
      'cPanel / FTP',
      'Yoast / RankMath',
    ],
    suggestedOutOfScope: [
      'Custom React Native / Mobile Apps',
      'Python / Django Web Services',
      '3D Game Programming',
      'Solidity Smart Contracts',
    ],
  },
  'Shopify Developer': {
    professionId: 'prof-shopify-dev',
    professionName: 'Shopify Developer',
    coreSkills: [
      'Shopify Liquid Theme Development',
      'Custom Shopify Sections & Blocks',
      'Shopify App Integration',
      'Store Migration & Product Setup',
      'Checkout & Payment Gateway Configuration',
      'Store Speed & Mobile Optimization',
      'Shopify Storefront API',
    ],
    toolsAndFrameworks: [
      'Shopify Liquid',
      'Shopify CLI',
      'HTML/CSS/JavaScript',
      'Klaviyo',
      'Shopify App Bridge',
      'PageFly / Shogun',
      'Git',
    ],
    suggestedOutOfScope: [
      'Custom Mobile iOS Native Coding',
      'Complex Database Server Infrastructure',
      'Game Development',
    ],
  },
  'Game Developer': {
    professionId: 'prof-game-dev',
    professionName: 'Game Developer',
    coreSkills: [
      'Gameplay Programming',
      'Game Physics & Collision',
      '2D/3D Math & Shaders',
      'AI Behaviors & State Machines',
      'Level Design & Scene Management',
      'Audio & Visual Particle Effects',
      'Multiplayer Networking',
      'Performance Profiling & Optimization',
    ],
    toolsAndFrameworks: [
      'Unity',
      'Unreal Engine',
      'C#',
      'C++',
      'Godot',
      'Blender',
      'Git LFS',
      'Steamworks SDK',
      'Photon / Netcode',
    ],
    suggestedOutOfScope: [
      'WordPress / E-commerce Store Building',
      'Corporate Accounting Systems',
      'SEO Marketing Strategy',
    ],
  },
  'DevOps & Cloud Engineer': {
    professionId: 'prof-devops-engineer',
    professionName: 'DevOps & Cloud Engineer',
    coreSkills: [
      'CI/CD Pipeline Automation',
      'Containerization & Orchestration',
      'Infrastructure as Code (IaC)',
      'Cloud Architecture (AWS/GCP/Azure)',
      'Server Monitoring & Logging',
      'SSL/TLS & Domain Management',
      'Load Balancing & Auto-scaling',
      'Linux Server Hardening',
    ],
    toolsAndFrameworks: [
      'Docker',
      'Kubernetes',
      'Terraform',
      'AWS (EC2, S3, ECS, RDS)',
      'Google Cloud (GCP)',
      'GitHub Actions',
      'GitLab CI',
      'Nginx',
      'Prometheus & Grafana',
      'Linux / Bash',
    ],
    suggestedOutOfScope: [
      'Figma Graphic / UI Design',
      'Frontend HTML/CSS Styling',
      'Content Copywriting',
    ],
  },
  'QA / Test Automation Engineer': {
    professionId: 'prof-qa-engineer',
    professionName: 'QA / Test Automation Engineer',
    coreSkills: [
      'Manual Test Case Design',
      'Automated E2E Testing',
      'API Testing & Validation',
      'Regression & Smoke Testing',
      'Bug Reporting & Tracking',
      'Performance & Load Testing',
      'Cross-Browser & Device Testing',
    ],
    toolsAndFrameworks: [
      'Cypress',
      'Playwright',
      'Selenium',
      'Jest',
      'Postman',
      'Jira',
      'k6 / JMeter',
      'GitHub Actions',
    ],
    suggestedOutOfScope: [
      'Full Application Feature Coding from Scratch',
      'Graphic Branding Design',
    ],
  },
  'Blockchain Developer': {
    professionId: 'prof-blockchain-dev',
    professionName: 'Blockchain Developer',
    coreSkills: [
      'Smart Contract Development',
      'DApp Web3 Integration',
      'Token Standards (ERC-20, ERC-721, ERC-1155)',
      'Gas Optimization',
      'Smart Contract Security & Testing',
      'Wallet Integration (MetaMask, WalletConnect)',
    ],
    toolsAndFrameworks: [
      'Solidity',
      'Hardhat',
      'Foundry',
      'Ethers.js / Web3.js',
      'Ethereum / Polygon / Arbitrum',
      'OpenZeppelin',
      'IPFS',
      'Remix IDE',
    ],
    suggestedOutOfScope: [
      'WordPress Elementor Site Setup',
      'Mobile iOS Swift Native Coding',
    ],
  },
  'AI / Machine Learning Engineer': {
    professionId: 'prof-ai-engineer',
    professionName: 'AI / Machine Learning Engineer',
    coreSkills: [
      'LLM Integration & Prompt Engineering',
      'RAG (Retrieval-Augmented Generation)',
      'Model Fine-Tuning',
      'Computer Vision / NLP',
      'Vector Embeddings & Semantic Search',
      'Data Preprocessing & Feature Engineering',
      'AI Agent Pipelines',
    ],
    toolsAndFrameworks: [
      'Python',
      'PyTorch',
      'TensorFlow',
      'LangChain / LlamaIndex',
      'OpenAI API / Gemini API',
      'Hugging Face',
      'Pinecone / ChromaDB',
      'FastAPI',
      'Pandas / NumPy',
    ],
    suggestedOutOfScope: [
      'WordPress Plugin Coding',
      'Graphic Print Packaging Design',
    ],
  },
  'Cybersecurity Specialist': {
    professionId: 'prof-cybersecurity-specialist',
    professionName: 'Cybersecurity Specialist',
    coreSkills: [
      'Vulnerability Assessment',
      'Penetration Testing',
      'Web Application Security (OWASP Top 10)',
      'Security Compliance & Auditing',
      'Network Security Analysis',
      'Incident Response Planning',
    ],
    toolsAndFrameworks: [
      'Burp Suite',
      'OWASP ZAP',
      'Nmap',
      'Wireshark',
      'Kali Linux',
      'Metasploit',
      'SonarQube',
    ],
    suggestedOutOfScope: [
      'UI/UX Visual Design',
      'Copywriting & Content Creation',
    ],
  },
  'Database Administrator': {
    professionId: 'prof-database-admin',
    professionName: 'Database Administrator',
    coreSkills: [
      'Database Schema Architecture',
      'SQL Query Optimization & Indexing',
      'Backup & Disaster Recovery',
      'Data Migration & ETL',
      'Replication & High Availability',
      'Database Security & Access Control',
    ],
    toolsAndFrameworks: [
      'PostgreSQL',
      'MySQL',
      'MongoDB',
      'Redis',
      'Oracle / SQL Server',
      'pgAdmin',
      'DBeaver',
      'Docker',
    ],
    suggestedOutOfScope: [
      'Frontend CSS & HTML Layouts',
      'Marketing Ad Management',
    ],
  },
  'Software Architect': {
    professionId: 'prof-software-architect',
    professionName: 'Software Architect',
    coreSkills: [
      'System Architecture Design',
      'Microservices vs Monolith Design',
      'Scalability & High Availability Planning',
      'Technology Stack Selection',
      'Technical Roadmapping & Documentation',
      'Security & Compliance Standards',
      'Design Patterns & Clean Code',
    ],
    toolsAndFrameworks: [
      'UML / C4 Model',
      'Lucidchart / Miro',
      'Cloud Design Patterns',
      'Docker / Kubernetes',
      'Enterprise Architecture Frameworks',
      'Git',
    ],
    suggestedOutOfScope: [
      'Basic HTML Copy Paste Editing',
      'Social Media Campaign Running',
    ],
  },

  // Design & Creative
  'UI/UX Designer': {
    professionId: 'prof-ui-ux-designer',
    professionName: 'UI/UX Designer',
    coreSkills: [
      'UI Design',
      'UX Design',
      'User Research',
      'Wireframing',
      'Prototyping',
      'Interaction Design',
      'Design Systems',
      'Information Architecture',
      'Usability Testing',
      'Responsive Web Design',
      'Mobile App UI Design',
      'Accessibility (WCAG)',
      'Design Handoff',
      'Micro-interactions',
    ],
    toolsAndFrameworks: [
      'Figma',
      'FigJam',
      'Adobe XD',
      'Sketch',
      'Miro',
      'Framer',
      'Principle',
      'Zeplin',
      'InVision',
      'Illustrator',
      'Photoshop',
    ],
    suggestedOutOfScope: [
      'Backend Server Coding',
      'Database Administration',
      'DevOps Server Infrastructure',
      'Network Engineering',
      'Cybersecurity Penetration Testing',
      '3D Game Engine Programming',
    ],
  },
  'Brand Identity Designer': {
    professionId: 'prof-brand-identity-designer',
    professionName: 'Brand Identity Designer',
    coreSkills: [
      'Brand Identity Systems',
      'Logo Design & Vector Crafting',
      'Color Theory & Palettes',
      'Typography Hierarchy',
      'Brand Guidelines Manuals',
      'Stationery & Collateral Design',
      'Brand Strategy & Positioning',
      'Vector Asset Exporting',
    ],
    toolsAndFrameworks: [
      'Adobe Illustrator',
      'Adobe Photoshop',
      'Adobe InDesign',
      'Figma',
      'Pantone Matching System',
    ],
    suggestedOutOfScope: [
      'Full-Stack Web Coding',
      'Database Management',
      'Paid Ad Media Buying',
    ],
  },
  'Graphic Designer': {
    professionId: 'prof-graphic-designer',
    professionName: 'Graphic Designer',
    coreSkills: [
      'Graphic Design Layouts',
      'Social Media Graphics',
      'Marketing Flyers & Banners',
      'Vector Graphics',
      'Photo Manipulation & Compositing',
      'Print Ready Preparation (CMYK/Bleed)',
      'Presentation Slide Decks',
      'Infographic Design',
    ],
    toolsAndFrameworks: [
      'Adobe Photoshop',
      'Adobe Illustrator',
      'Adobe InDesign',
      'Canva Pro',
      'Figma',
    ],
    suggestedOutOfScope: [
      'Software Coding & Backend APIs',
      'Complex Database Administration',
    ],
  },
  'Illustrator & Digital Artist': {
    professionId: 'prof-illustrator',
    professionName: 'Illustrator & Digital Artist',
    coreSkills: [
      'Digital Painting',
      'Vector Illustration',
      'Character Design',
      'Book & Editorial Illustration',
      'Concept Art',
      'Custom Iconography',
      'Storyboarding',
    ],
    toolsAndFrameworks: [
      'Procreate',
      'Adobe Illustrator',
      'Adobe Photoshop',
      'Clip Studio Paint',
      'Wacom / iPad Pro',
    ],
    suggestedOutOfScope: [
      'Web Application Programming',
      'Server Setup & Hosting',
    ],
  },
  '3D Artist & Modeler': {
    professionId: 'prof-3d-artist',
    professionName: '3D Artist & Modeler',
    coreSkills: [
      '3D Modeling (High/Low Poly)',
      'UV Unwrapping & Texturing',
      'PBR Material Shading',
      'Photorealistic 3D Rendering',
      'Lighting & Camera Composition',
      'Character Rigging & Animation',
      'Product 3D Mockups',
    ],
    toolsAndFrameworks: [
      'Blender',
      'Autodesk Maya',
      'Cinema 4D',
      'ZBrush',
      'Substance 3D Painter',
      'Octane / Redshift / Cycles',
      'KeyShot',
    ],
    suggestedOutOfScope: [
      'Web Application Backend Coding',
      'SEO Keyword Research',
    ],
  },
  'Packaging & Print Designer': {
    professionId: 'prof-packaging-designer',
    professionName: 'Packaging & Print Designer',
    coreSkills: [
      'Dieline Preparation & Packaging Layout',
      'Box & Bottle Label Design',
      'Prepress & Print Production (CMYK/Spot Colors)',
      '3D Packaging Mockups',
      'Barcode & Compliance Labeling',
      'Paper & Finish Selection (Foil, Emboss, Matte)',
    ],
    toolsAndFrameworks: [
      'Adobe Illustrator',
      'Adobe InDesign',
      'Adobe Photoshop',
      'ESKO / 3D Packaging Tools',
    ],
    suggestedOutOfScope: [
      'Software Web Development',
      'Mobile iOS/Android Coding',
    ],
  },

  // Video & Animation
  'Video Editor': {
    professionId: 'prof-video-editor',
    professionName: 'Video Editor',
    coreSkills: [
      'Video Editing & Pacing',
      'Color Correction & Grading',
      'Audio Clean-up & Sound Sync',
      'Multi-Cam Editing',
      'Transitions & Visual Effects',
      'Social Media Formats (Reels, TikTok, YouTube 16:9)',
      'Subtitling & Closed Captions',
      'B-Roll & Music Sourcing',
    ],
    toolsAndFrameworks: [
      'Adobe Premiere Pro',
      'DaVinci Resolve',
      'Final Cut Pro',
      'CapCut Desktop',
      'Adobe Audition',
      'After Effects (Basic)',
    ],
    suggestedOutOfScope: [
      'Full Software Development',
      'Custom 3D Game Engine Coding',
      'Database Architecture',
    ],
  },
  'Motion Graphics Designer': {
    professionId: 'prof-motion-graphics-designer',
    professionName: 'Motion Graphics Designer',
    coreSkills: [
      '2D Motion Graphics',
      'Kinetic Typography',
      'Logo Animation & Intros',
      'Explainer Video Animation',
      'Visual Effects Compositing',
      'Keyframe Animation & Timing',
      'Sound Effects Integration',
    ],
    toolsAndFrameworks: [
      'Adobe After Effects',
      'Adobe Illustrator',
      'Adobe Photoshop',
      'Cinema 4D',
      'Lottie / Bodymovin',
      'Premiere Pro',
    ],
    suggestedOutOfScope: [
      'Full-Stack Web Coding',
      'Server Infrastructure Setup',
    ],
  },
  '2D/3D Animator': {
    professionId: 'prof-animator',
    professionName: '2D/3D Animator',
    coreSkills: [
      'Character Animation (12 Principles)',
      'Frame-by-Frame Animation',
      'Rigging & Puppet Animation',
      'Storyboarding & Scene Blocking',
      'Lip-sync Animation',
      'Whiteboard Explainer Animation',
    ],
    toolsAndFrameworks: [
      'Toon Boom Harmony',
      'Adobe Animate',
      'Blender',
      'After Effects',
      'Vyond / Doodly',
    ],
    suggestedOutOfScope: [
      'Backend API Development',
      'Database Administration',
    ],
  },

  // Writing & Translation
  'Content Writer': {
    professionId: 'prof-content-writer',
    professionName: 'Content Writer',
    coreSkills: [
      'SEO Article & Blog Writing',
      'In-Depth Topic Research',
      'Audience Engagement & Tone Matching',
      'Editing & Proofreading',
      'Headline Optimization',
      'Keyword Integration',
      'Plagiarism-Free Originality',
      'Formatting for Web Readability',
    ],
    toolsAndFrameworks: [
      'Google Docs',
      'Grammarly Premium',
      'Hemingway Editor',
      'WordPress CMS',
      'Notion',
      'SurferSEO / Clearscope',
    ],
    suggestedOutOfScope: [
      'Software Coding & Web Development',
      'Video Animation & Editing',
      'Graphic Brand Identity Creation',
    ],
  },
  'Copywriter': {
    professionId: 'prof-copywriter',
    professionName: 'Copywriter',
    coreSkills: [
      'Sales Copywriting',
      'Landing Page Copy',
      'Ad Copy (Facebook, Google, TikTok)',
      'Email Marketing Sequences',
      'Call to Action (CTA) Optimization',
      'Consumer Psychology & Hooks',
      'Brand Voice & Messaging Frameworks',
    ],
    toolsAndFrameworks: [
      'Google Docs',
      'Grammarly',
      'Notion',
      'AIDA / PAS Copywriting Frameworks',
    ],
    suggestedOutOfScope: [
      'Full-Stack Web Engineering',
      'Custom Software Architecture',
    ],
  },
  'Technical Writer': {
    professionId: 'prof-technical-writer',
    professionName: 'Technical Writer',
    coreSkills: [
      'API & SDK Documentation',
      'Software User Manuals & Guides',
      'Technical Architecture Specs',
      'Markdown & Docs-as-Code',
      'Code Snippet Explanation',
      'Release Notes & Changelogs',
    ],
    toolsAndFrameworks: [
      'Markdown',
      'Git / GitHub',
      'Swagger / OpenAPI',
      'GitBook / Docusaurus',
      'Postman',
      'Google Docs',
    ],
    suggestedOutOfScope: [
      'Graphic Visual Packaging Design',
      'Paid Ads Campaign Management',
    ],
  },
  'Translator': {
    professionId: 'prof-translator',
    professionName: 'Translator',
    coreSkills: [
      'Document Translation',
      'Localization & Cultural Adaptation',
      'Proofreading & Post-Editing',
      'Terminology Management',
      'Subtitling & Transcription',
    ],
    toolsAndFrameworks: [
      'SDL Trados',
      'MemoQ',
      'Smartcat',
      'DeepL Pro',
      'Google Workspace',
    ],
    suggestedOutOfScope: [
      'Software Engineering & Codebases',
      '3D Video Animation',
    ],
  },
  'Resume & Career Document Specialist': {
    professionId: 'prof-resume-writer',
    professionName: 'Resume & Career Document Specialist',
    coreSkills: [
      'ATS-Optimized Resume Writing',
      'Cover Letter Customization',
      'LinkedIn Profile Optimization',
      'Executive Bio Drafting',
      'Career Storytelling & Metrics Framing',
    ],
    toolsAndFrameworks: [
      'Jobscan (ATS Simulation)',
      'Microsoft Word / Google Docs',
      'Canva (Executive Layouts)',
      'LinkedIn',
    ],
    suggestedOutOfScope: [
      'Software Web Development',
      'Video Animation Production',
    ],
  },

  // Digital Marketing
  'SEO Specialist': {
    professionId: 'prof-seo-specialist',
    professionName: 'SEO Specialist',
    coreSkills: [
      'On-Page SEO Optimization',
      'Technical SEO Auditing',
      'Keyword Research & Intent Mapping',
      'Link Building & Backlink Strategy',
      'Local SEO & Google Business Profile',
      'Competitor SEO Analysis',
      'Core Web Vitals & Crawlability',
      'Schema Markup Implementation',
    ],
    toolsAndFrameworks: [
      'Ahrefs',
      'SEMrush',
      'Google Search Console',
      'Google Analytics (GA4)',
      'Screaming Frog',
      'Surfer SEO',
      'Yoast / Rank Math',
    ],
    suggestedOutOfScope: [
      'Complex Full-Stack Application Programming',
      '3D Character Animation',
      'Audio Mastering',
    ],
  },
  'Social Media Manager': {
    professionId: 'prof-social-media-manager',
    professionName: 'Social Media Manager',
    coreSkills: [
      'Social Media Content Strategy',
      'Monthly Content Calendars',
      'Community Engagement & Moderation',
      'Hashtag & Viral Trend Research',
      'Performance Analytics & Reporting',
      'Organic Audience Growth',
      'Caption Copywriting',
    ],
    toolsAndFrameworks: [
      'Buffer',
      'Hootsuite',
      'Later',
      'Meta Business Suite',
      'Canva Pro',
      'CapCut',
      'Notion',
    ],
    suggestedOutOfScope: [
      'Full Software Code Engineering',
      'Database Administration',
    ],
  },
  'PPC & Paid Ads Specialist': {
    professionId: 'prof-media-buyer',
    professionName: 'PPC & Paid Ads Specialist',
    coreSkills: [
      'Paid Ad Campaign Setup (Google/Meta/TikTok)',
      'A/B Creative & Copy Testing',
      'Conversion Rate Optimization (CRO)',
      'Pixel & Conversion API Tracking',
      'Audience Segmentation & Retargeting',
      'ROAS & Budget Optimization',
    ],
    toolsAndFrameworks: [
      'Google Ads Manager',
      'Meta Ads Manager',
      'TikTok Ads Manager',
      'Google Tag Manager',
      'Google Analytics 4',
      'Triple Whale',
    ],
    suggestedOutOfScope: [
      'Custom Web App Code Development',
      '3D Animation Production',
    ],
  },
  'Email Marketing Specialist': {
    professionId: 'prof-email-marketer',
    professionName: 'Email Marketing Specialist',
    coreSkills: [
      'Email Automated Flows & Drip Sequences',
      'Newsletter Campaign Creation',
      'List Segmentation & Hygiene',
      'Email Deliverability & Spam Score Optimization',
      'A/B Subject Line Testing',
      'E-commerce Retention Strategy',
    ],
    toolsAndFrameworks: [
      'Klaviyo',
      'Mailchimp',
      'ActiveCampaign',
      'ConvertKit',
      'HTML/CSS for Email',
      'Canva',
    ],
    suggestedOutOfScope: [
      'Full Application Backend Coding',
      'Game Engine Development',
    ],
  },

  // Music & Audio
  'Voice Over Artist': {
    professionId: 'prof-voice-artist',
    professionName: 'Voice Over Artist',
    coreSkills: [
      'Commercial Voice Over',
      'Narration & Audiobooks',
      'Character & Animation Voices',
      'Script Interpretation & Timing',
      'High-Quality Studio Recording (Clean Room)',
      'Audio Breath & Noise Editing',
    ],
    toolsAndFrameworks: [
      'Adobe Audition',
      'Audacity',
      'Reaper',
      'Focusrite Scarlett / Apollo Twin',
      'Shure SM7B / Rode NT1',
      'iZotope RX Noise Removal',
    ],
    suggestedOutOfScope: [
      'Web Application Coding',
      'Paid Advertising Media Buying',
      'Graphic Print Packaging',
    ],
  },
  'Music Producer & Composer': {
    professionId: 'prof-music-producer',
    professionName: 'Music Producer & Composer',
    coreSkills: [
      'Music Composition & Arrangement',
      'Beat Making & Instrumentals',
      'MIDI Programming',
      'Commercial Jingles & Intro Music',
      'Film & Game Soundtrack Scoring',
      'Audio Plugin Synthesis',
    ],
    toolsAndFrameworks: [
      'FL Studio',
      'Ableton Live',
      'Logic Pro X',
      'Pro Tools',
      'Native Instruments Kontakt',
      'Serum / Omnisphere',
      'FabFilter Plugins',
    ],
    suggestedOutOfScope: [
      'Software Full-Stack Development',
      'Database Schema Migration',
    ],
  },
  'Audio Engineer & Sound Designer': {
    professionId: 'prof-audio-engineer',
    professionName: 'Audio Engineer & Sound Designer',
    coreSkills: [
      'Audio Mixing & Stem Balancing',
      'Mastering for Streaming (Loudness/LUFS Standards)',
      'Podcast Noise Cleaning & Leveling',
      'Foley & Game Sound Effects Creation',
      'Vocal Tuning (Auto-Tune / Melodyne)',
    ],
    toolsAndFrameworks: [
      'Pro Tools',
      'iZotope Ozone & RX',
      'FabFilter Suite',
      'Waves Audio Plugins',
      'Melodyne',
      'Soundly / Epidemic Sound',
    ],
    suggestedOutOfScope: [
      'Web Development & Coding',
      'SEO Strategy',
    ],
  },

  // Business & Consulting
  'Virtual Assistant': {
    professionId: 'prof-virtual-assistant',
    professionName: 'Virtual Assistant',
    coreSkills: [
      'Email & Calendar Inbox Management',
      'Data Entry & Spreadsheet Organization',
      'Customer Support & Ticket Response',
      'Web Research & Data Mining',
      'Travel Booking & Itinerary Planning',
      'File Management & Organization',
      'CRM Contact Updating',
    ],
    toolsAndFrameworks: [
      'Google Workspace',
      'Microsoft Excel / Office 365',
      'Notion',
      'Trello / Asana / ClickUp',
      'Slack',
      'Zendesk / Freshdesk',
      'HubSpot CRM',
      'Canva',
    ],
    suggestedOutOfScope: [
      'Full Software Engineering Codebases',
      '3D Modeling & Shading',
      'Smart Contract Solidity Development',
    ],
  },
  'Financial Consultant / Analyst': {
    professionId: 'prof-financial-analyst',
    professionName: 'Financial Consultant / Analyst',
    coreSkills: [
      'Financial Modeling & Forecasting',
      'Cash Flow & P&L Statement Analysis',
      'Valuation & Investment Analysis',
      'Budget Planning & Expense Optimization',
      'Bookkeeping Reconciliation',
      'Investor Pitch Deck Financials',
    ],
    toolsAndFrameworks: [
      'Microsoft Excel (Advanced VBA/Formulas)',
      'QuickBooks Online',
      'Xero',
      'Power BI',
      'Google Sheets',
    ],
    suggestedOutOfScope: [
      'Web Design & UI Layouts',
      'Video Animation Production',
    ],
  },
  'Business Plan Consultant': {
    professionId: 'prof-business-consultant',
    professionName: 'Business Plan Consultant',
    coreSkills: [
      'Comprehensive Business Plan Writing',
      'Market & Industry Research',
      'Competitor Landscape Analysis',
      'SWOT & Business Model Canvas',
      'Go-To-Market (GTM) Strategy',
      'Executive Summary Framing for Investors/Banks',
    ],
    toolsAndFrameworks: [
      'Google Docs / MS Word',
      'LivePlan',
      'Excel (Financial Projections)',
      'Statista / IBISWorld Research',
    ],
    suggestedOutOfScope: [
      'Custom Software Coding',
      'Mobile iOS/Android Development',
    ],
  },

  // Data & AI
  'Data Analyst': {
    professionId: 'prof-data-analyst',
    professionName: 'Data Analyst',
    coreSkills: [
      'Data Cleaning & Transformation',
      'Exploratory Data Analysis (EDA)',
      'SQL Queries & Aggregations',
      'Interactive Dashboard Development',
      'KPI Reporting & Metric Tracking',
      'Statistical Analysis',
      'Business Intelligence Reporting',
      'Data Storytelling',
    ],
    toolsAndFrameworks: [
      'SQL',
      'Power BI',
      'Tableau',
      'Excel (Pivot Tables / Power Query)',
      'Python',
      'Pandas',
      'NumPy',
      'Jupyter Notebooks',
      'Google Looker Studio',
      'PostgreSQL / BigQuery',
    ],
    suggestedOutOfScope: [
      'Frontend React / Mobile UI Coding',
      'Brand Identity Logo Design',
      'Video Motion Graphics',
      'Paid Ad Creative Design',
    ],
  },
  'Data Scientist': {
    professionId: 'prof-data-scientist',
    professionName: 'Data Scientist',
    coreSkills: [
      'Predictive Modeling & Machine Learning',
      'Statistical Hypothesis Testing',
      'Data Preprocessing & Feature Engineering',
      'Classification & Regression Models',
      'Natural Language Processing (NLP)',
      'Deep Learning Basics',
      'Model Evaluation & Validation',
    ],
    toolsAndFrameworks: [
      'Python',
      'R',
      'Scikit-Learn',
      'Pandas',
      'NumPy',
      'TensorFlow / PyTorch',
      'JupyterLab',
      'SQL',
      'Seaborn / Matplotlib',
    ],
    suggestedOutOfScope: [
      'WordPress Theme Coding',
      'Social Media Posting & Management',
    ],
  },
  'Data Engineer / Web Scraper': {
    professionId: 'prof-data-engineer',
    professionName: 'Data Engineer / Web Scraper',
    coreSkills: [
      'Automated Web Scraping & Crawling',
      'Bypassing Anti-Bot & Captchas',
      'ETL Pipeline Engineering',
      'Data Cleaning & Deduplication',
      'Database Ingestion & Storage',
      'API Data Extraction',
      'Scheduled Scraper Jobs',
    ],
    toolsAndFrameworks: [
      'Python',
      'BeautifulSoup',
      'Scrapy',
      'Selenium / Playwright',
      'Pandas',
      'PostgreSQL',
      'MongoDB',
      'Docker',
      'Cron / Airflow',
    ],
    suggestedOutOfScope: [
      'UI/UX Wireframing & Design Systems',
      'Audio Production & Mastering',
    ],
  },

  // Photography
  'Product Photographer': {
    professionId: 'prof-product-photographer',
    professionName: 'Product Photographer',
    coreSkills: [
      'Studio Product Photography',
      'Studio Lighting (Softbox, Strobe, Diffuser)',
      'White Background E-commerce Shots',
      'Lifestyle Staged Product Shots',
      'High-Resolution RAW Capture',
      'Focus Stacking',
    ],
    toolsAndFrameworks: [
      'Adobe Lightroom',
      'Capture One Pro',
      'Adobe Photoshop',
      'Canon / Sony / Nikon Professional Bodies',
      'Studio Lighting Equipment',
    ],
    suggestedOutOfScope: [
      'Software Coding & Web Engineering',
      'Social Media Paid Ad Strategy',
    ],
  },
  'Photo Editor & Retoucher': {
    professionId: 'prof-photo-retoucher',
    professionName: 'Photo Editor & Retoucher',
    coreSkills: [
      'High-End Skin Retouching (Frequency Separation)',
      'Background Removal & Clipping Path',
      'Color Correction & White Balance',
      'Object Removal & Image Cleanup',
      'Shadow & Reflection Creation',
      'E-commerce Batch Processing',
    ],
    toolsAndFrameworks: [
      'Adobe Photoshop',
      'Adobe Lightroom',
      'Capture One',
      'Wacom Tablet',
    ],
    suggestedOutOfScope: [
      'Custom Web App Coding',
      'Database Architecture',
    ],
  },

  // Lifestyle & Personal
  'Online Tutor / Instructor': {
    professionId: 'prof-online-tutor',
    professionName: 'Online Tutor / Instructor',
    coreSkills: [
      'Curriculum & Lesson Planning',
      'Interactive One-on-One Instruction',
      'Concept Simplification & Explanations',
      'Homework Review & Feedback',
      'Exam & Test Preparation',
      'Student Progress Tracking',
    ],
    toolsAndFrameworks: [
      'Zoom / Google Meet',
      'Miro / Digital Whiteboard',
      'Google Classroom / Notion',
      'LMS Platforms',
    ],
    suggestedOutOfScope: [
      'Full Software Development',
      'Enterprise Database Administration',
    ],
  },
  'Career & Interview Coach': {
    professionId: 'prof-career-coach',
    professionName: 'Career & Interview Coach',
    coreSkills: [
      'Mock Interviewing & Behavioral Prep (STAR Method)',
      'Salary Negotiation Coaching',
      'Job Search Strategy & Networking Guidance',
      'Personal Branding & Pitch Development',
      'Confidence & Communication Mentoring',
    ],
    toolsAndFrameworks: [
      'Zoom / Google Meet',
      'LinkedIn',
      'Google Docs / Worksheets',
      'Notion',
    ],
    suggestedOutOfScope: [
      'Web Application Engineering',
      'Video Animation Production',
    ],
  },
  'Life & Wellness Coach': {
    professionId: 'prof-life-coach',
    professionName: 'Life & Wellness Coach',
    coreSkills: [
      'Goal Setting & Accountability Tracking',
      'Habit Building & Productivity Systems',
      'Mindset & Stress Management Guidance',
      'Work-Life Balance Strategy',
      'Active Empathetic Listening',
    ],
    toolsAndFrameworks: [
      'Zoom / Google Meet',
      'Notion Worksheets',
      'Habit Trackers',
      'Google Calendar',
    ],
    suggestedOutOfScope: [
      'Software Backend Development',
      'Graphic Print Packaging',
    ],
  },
};

// HELPER FUNCTIONS FOR CASCADING TAXONOMY LOOKUPS

export function getCategories(): ICategoryTaxonomy[] {
  return MASTER_CATEGORIES;
}

export function getCategoryById(categoryId: string): ICategoryTaxonomy | undefined {
  return MASTER_CATEGORIES.find((c) => c.id === categoryId);
}

export function getCategoryByName(categoryName: string): ICategoryTaxonomy | undefined {
  if (!categoryName) return undefined;
  const lower = categoryName.toLowerCase().trim();
  return MASTER_CATEGORIES.find(
    (c) => c.name.toLowerCase() === lower || c.id.toLowerCase() === lower
  );
}

export function getServicesForCategories(categoryIds: string[]): IServiceTaxonomy[] {
  if (!categoryIds || categoryIds.length === 0) return [];
  const set = new Set(categoryIds);
  return MASTER_SERVICES.filter((s) => set.has(s.categoryId));
}

export function getProfessionsForServices(
  categoryIds: string[],
  selectedServiceNames: string[]
): IProfessionTaxonomy[] {
  if (!categoryIds || categoryIds.length === 0) return [];
  const catSet = new Set(categoryIds);
  const catProfessions = MASTER_PROFESSIONS.filter((p) => catSet.has(p.categoryId));

  if (!selectedServiceNames || selectedServiceNames.length === 0) {
    return catProfessions;
  }

  // Find matching service IDs
  const serviceIdSet = new Set(
    MASTER_SERVICES.filter(
      (s) =>
        catSet.has(s.categoryId) &&
        selectedServiceNames.some(
          (sel) => sel.toLowerCase().trim() === s.name.toLowerCase().trim()
        )
    ).map((s) => s.id)
  );

  // Return professions that match at least one selected service
  const matched = catProfessions.filter((p) =>
    p.relevantServiceIds.some((sId) => serviceIdSet.has(sId))
  );

  // If no exact match (e.g. custom services), fallback to all professions in the category
  return matched.length > 0 ? matched : catProfessions;
}

export function getKnowledgeCatalogForProfessions(
  professionNames: string[]
): {
  coreSkills: string[];
  toolsAndFrameworks: string[];
  suggestedOutOfScope: string[];
} {
  const coreSkillsSet = new Set<string>();
  const toolsSet = new Set<string>();
  const outOfScopeSet = new Set<string>();

  if (!professionNames || professionNames.length === 0) {
    return {
      coreSkills: [],
      toolsAndFrameworks: [],
      suggestedOutOfScope: [],
    };
  }

  for (const pName of professionNames) {
    if (!pName) continue;
    // Check exact name match or fuzzy
    const exactCatalog = PROFESSION_KNOWLEDGE_CATALOGS[pName];
    if (exactCatalog) {
      exactCatalog.coreSkills.forEach((s) => coreSkillsSet.add(s));
      exactCatalog.toolsAndFrameworks.forEach((t) => toolsSet.add(t));
      exactCatalog.suggestedOutOfScope.forEach((o) => outOfScopeSet.add(o));
      continue;
    }

    // Try finding by case-insensitive or partial match
    const lower = pName.toLowerCase().trim();
    const foundKey = Object.keys(PROFESSION_KNOWLEDGE_CATALOGS).find(
      (k) => k.toLowerCase() === lower || lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)
    );

    if (foundKey && PROFESSION_KNOWLEDGE_CATALOGS[foundKey]) {
      const catalog = PROFESSION_KNOWLEDGE_CATALOGS[foundKey];
      catalog.coreSkills.forEach((s) => coreSkillsSet.add(s));
      catalog.toolsAndFrameworks.forEach((t) => toolsSet.add(t));
      catalog.suggestedOutOfScope.forEach((o) => outOfScopeSet.add(o));
    }
  }

  return {
    coreSkills: Array.from(coreSkillsSet),
    toolsAndFrameworks: Array.from(toolsSet),
    suggestedOutOfScope: Array.from(outOfScopeSet),
  };
}

export function calculateAutomaticOutOfScope(
  categoryIds: string[],
  selectedServices: string[],
  selectedProfessions: string[]
): string[] {
  if (!categoryIds || categoryIds.length === 0 || (!selectedServices.length && !selectedProfessions.length)) {
    return [];
  }

  const outOfScopeSet = new Set<string>();

  // 1. All unselected services from the selected categories
  const catSet = new Set(categoryIds);
  const normalizedSelectedServices = new Set(
    selectedServices.map((s) => s.toLowerCase().trim())
  );

  const unselectedServices = MASTER_SERVICES.filter(
    (s) => catSet.has(s.categoryId) && !normalizedSelectedServices.has(s.name.toLowerCase().trim())
  );

  for (const s of unselectedServices) {
    outOfScopeSet.add(s.name);
  }

  // 2. Profession-specific suggested out-of-scope items
  const catalog = getKnowledgeCatalogForProfessions(selectedProfessions);
  for (const item of catalog.suggestedOutOfScope) {
    // Avoid adding items that are already selected as a supported service
    if (!normalizedSelectedServices.has(item.toLowerCase().trim())) {
      outOfScopeSet.add(item);
    }
  }

  return Array.from(outOfScopeSet);
}

export function filterAutocompleteItems(
  query: string,
  catalogItems: string[],
  selectedItems: string[]
): string[] {
  const selectedNormalized = new Set(
    selectedItems.map((s) => s.toLowerCase().trim())
  );

  const available = catalogItems.filter(
    (item) => !selectedNormalized.has(item.toLowerCase().trim())
  );

  if (!query || !query.trim()) {
    // Return top available suggestions if query empty
    return available.slice(0, 15);
  }

  const q = query.toLowerCase().trim();

  // Sort by startsWith first, then includes
  const startsWith = available.filter((item) => item.toLowerCase().startsWith(q));
  const includes = available.filter(
    (item) => !item.toLowerCase().startsWith(q) && item.toLowerCase().includes(q)
  );

  return [...startsWith, ...includes].slice(0, 12);
}

export function findCategoryForProfession(professionName?: string): ICategoryTaxonomy | undefined {
  if (!professionName) return undefined;
  const prof = MASTER_PROFESSIONS.find(
    (p) =>
      p.name.toLowerCase().trim() === professionName.toLowerCase().trim() ||
      professionName.toLowerCase().includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(professionName.toLowerCase())
  );
  if (prof) {
    return MASTER_CATEGORIES.find((c) => c.id === prof.categoryId);
  }
  return undefined;
}

export function findServicesForProfession(professionName?: string): string[] {
  if (!professionName) return [];
  const prof = MASTER_PROFESSIONS.find(
    (p) =>
      p.name.toLowerCase().trim() === professionName.toLowerCase().trim() ||
      professionName.toLowerCase().includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(professionName.toLowerCase())
  );
  if (!prof) return [];

  const matchedServices = MASTER_SERVICES.filter((s) =>
    prof.relevantServiceIds.includes(s.id)
  ).map((s) => s.name);

  return matchedServices;
}

