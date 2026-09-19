/**
 * Dynamic Template Variable System
 *
 * Requirements:
 * 1. Supports placeholders:
 *    - {{clientName}}
 *    - {{freelancerName}}
 *    - {{projectName}}
 *    - {{deliveryDate}}
 * 2. Stored exactly as written in MongoDB.
 * 3. Resolves:
 *    - {{clientName}} from currently selected client/inquiry
 *    - {{freelancerName}} from authenticated user's profile
 *    - {{projectName}} from current project/inquiry when available
 *    - {{deliveryDate}} from current delivery information when available
 * 4. Reusable TypeScript utility: renderTemplate(content, context)
 * 5. Unknown or missing variables must NOT be silently replaced with fake values.
 *    Keep unresolved placeholder or return a validation error.
 */

export const SUPPORTED_TEMPLATE_VARIABLES = [
  '{{clientName}}',
  '{{freelancerName}}',
  '{{projectName}}',
  '{{deliveryDate}}',
] as const;

export type SupportedTemplateVariable = (typeof SUPPORTED_TEMPLATE_VARIABLES)[number];

export interface TemplateVariableMeta {
  key: string;
  placeholder: SupportedTemplateVariable;
  label: string;
  description: string;
}

export const TEMPLATE_VARIABLES_CONFIG: TemplateVariableMeta[] = [
  {
    key: 'clientName',
    placeholder: '{{clientName}}',
    label: 'Client Name',
    description: 'Name of currently selected client or inquiry',
  },
  {
    key: 'freelancerName',
    placeholder: '{{freelancerName}}',
    label: 'Freelancer Name',
    description: "Your name from authenticated profile",
  },
  {
    key: 'projectName',
    placeholder: '{{projectName}}',
    label: 'Project Name',
    description: 'Project title or inquiry subject when available',
  },
  {
    key: 'deliveryDate',
    placeholder: '{{deliveryDate}}',
    label: 'Delivery Date',
    description: 'Target delivery milestone or estimated timeline when available',
  },
];

export interface TemplateContext {
  clientName?: string | null;
  freelancerName?: string | null;
  projectName?: string | null;
  deliveryDate?: string | null;
  [key: string]: any;
}

export interface RenderTemplateOptions {
  strict?: boolean;
  throwOnError?: boolean;
}

export class TemplateValidationError extends Error {
  missingVariables: string[];
  unknownVariables: string[];

  constructor(message: string, missing: string[] = [], unknown: string[] = []) {
    super(message);
    this.name = 'TemplateValidationError';
    this.missingVariables = missing;
    this.unknownVariables = unknown;
  }
}

/**
 * Reusable TypeScript utility to render template content with context.
 *
 * Unknown or missing variables must NOT be silently replaced with fake values.
 * It keeps unresolved placeholders exactly as {{placeholder}} or throws/returns validation error.
 */
export function renderTemplate(
  content: string | undefined | null,
  context?: TemplateContext,
  options?: RenderTemplateOptions
): string {
  if (!content) return '';

  const ctx: TemplateContext = context || {};
  const supportedKeys = new Set<string>(TEMPLATE_VARIABLES_CONFIG.map((v) => v.key));

  const missing: string[] = [];
  const unknown: string[] = [];

  // Match all {{variableName}} with optional inner whitespace
  const rendered = content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, varName) => {
    // Check if recognized or present in context
    if (!supportedKeys.has(varName) && !(varName in ctx)) {
      unknown.push(varName);
      return match;
    }

    const val = ctx[varName];
    // Check if value is defined and non-empty string/number
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val);
    }

    // Missing value: Keep unresolved placeholder, never replace with fake values
    missing.push(varName);
    return match;
  });

  if (options?.throwOnError && (missing.length > 0 || unknown.length > 0)) {
    const details = [
      missing.length > 0 ? `missing: ${missing.map((m) => `{{${m}}}`).join(', ')}` : '',
      unknown.length > 0 ? `unknown: ${unknown.map((u) => `{{${u}}}`).join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('; ');
    throw new TemplateValidationError(`Template rendering validation failed (${details})`, missing, unknown);
  }

  return rendered;
}

/**
 * Validates template content against a context and returns any unresolved, missing, or unknown variables.
 */
export function validateTemplate(
  content: string | undefined | null,
  context?: TemplateContext
): {
  isValid: boolean;
  unresolvedVariables: string[];
  missingVariables: string[];
  unknownVariables: string[];
  usedVariables: string[];
} {
  if (!content) {
    return {
      isValid: true,
      unresolvedVariables: [],
      missingVariables: [],
      unknownVariables: [],
      usedVariables: [],
    };
  }

  const ctx: TemplateContext = context || {};
  const supportedKeys = new Set<string>(TEMPLATE_VARIABLES_CONFIG.map((v) => v.key));
  const missing: string[] = [];
  const unknown: string[] = [];
  const used: string[] = [];

  const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) {
    const varName = m[1];
    if (!used.includes(varName)) {
      used.push(varName);
    }
    if (!supportedKeys.has(varName) && !(varName in ctx)) {
      if (!unknown.includes(varName)) unknown.push(varName);
    } else {
      const val = ctx[varName];
      if (val === undefined || val === null || String(val).trim() === '') {
        if (!missing.includes(varName)) missing.push(varName);
      }
    }
  }

  const unresolved = Array.from(new Set([...missing, ...unknown]));

  return {
    isValid: unresolved.length === 0,
    unresolvedVariables: unresolved,
    missingVariables: missing,
    unknownVariables: unknown,
    usedVariables: used,
  };
}

/**
 * Builds the dynamic TemplateContext from inquiry, client, user, and profile models.
 * Strictly avoids hardcoded names or fake data.
 */
export function buildTemplateContext(params: {
  inquiry?: any | null;
  client?: any | null;
  user?: any | null;
  userProfile?: any | null;
  projectName?: string | null;
  deliveryDate?: string | null;
}): TemplateContext {
  const { inquiry, client, user, userProfile } = params;

  // 1. clientName from selected client/inquiry
  let clientName: string | undefined = undefined;
  if (inquiry?.clientName && inquiry.clientName.trim()) {
    clientName = inquiry.clientName.trim();
  } else if (client?.name && client.name.trim()) {
    clientName = client.name.trim();
  }

  // 2. freelancerName from authenticated user's profile or user
  let freelancerName: string | undefined = undefined;
  if (userProfile?.name && userProfile.name.trim()) {
    freelancerName = userProfile.name.trim();
  } else if (user?.name && user.name.trim()) {
    freelancerName = user.name.trim();
  }

  // 3. projectName from current project/inquiry when available
  let projectName: string | undefined = undefined;
  if (params.projectName && params.projectName.trim()) {
    projectName = params.projectName.trim();
  } else if (inquiry?.projectName && inquiry.projectName.trim()) {
    projectName = inquiry.projectName.trim();
  } else if (inquiry?.subject && inquiry.subject.trim()) {
    projectName = inquiry.subject.trim();
  }

  // 4. deliveryDate from delivery info when available
  let deliveryDate: string | undefined = undefined;
  if (params.deliveryDate && params.deliveryDate.trim()) {
    deliveryDate = params.deliveryDate.trim();
  } else if (inquiry?.deliveryDate && inquiry.deliveryDate.trim()) {
    deliveryDate = inquiry.deliveryDate.trim();
  } else if (
    inquiry?.analysisResult?.pricingEstimate?.deliveryDays &&
    typeof inquiry.analysisResult.pricingEstimate.deliveryDays === 'number' &&
    inquiry.analysisResult.pricingEstimate.deliveryDays > 0
  ) {
    const days = inquiry.analysisResult.pricingEstimate.deliveryDays;
    const baseDate = inquiry.createdAt ? new Date(inquiry.createdAt) : new Date();
    const target = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
    deliveryDate = target.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return {
    clientName: clientName || undefined,
    freelancerName: freelancerName || undefined,
    projectName: projectName || undefined,
    deliveryDate: deliveryDate || undefined,
  };
}
