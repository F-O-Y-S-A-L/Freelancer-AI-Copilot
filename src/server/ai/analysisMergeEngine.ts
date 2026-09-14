import { normalizeSkill, matchSkills, ISkillMatchResult } from './skillEngine.js';
import { calculatePricing, IPricingEngineResult } from './pricingEngine.js';
import { IRequirementExtraction } from './geminiService.js';
import { IUserProfile } from '../../shared/types.js';

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'up', 'about',
  'into', 'over', 'after', 'please', 'must', 'need', 'needs', 'want', 'wants',
  'should', 'client', 'also', 'as', 'that', 'this', 'these', 'those', 'can',
]);

/**
 * Normalizes a text string into canonical tokens for semantic comparison.
 */
export function extractSignificantTokens(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

/**
 * Checks if two text requirements or questions are semantically equivalent.
 */
export function areSemanticallyEquivalent(strA: string, strB: string): boolean {
  if (!strA || !strB) return false;

  const cleanA = strA.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const cleanB = strB.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  // 1. Exact cleaned match
  if (cleanA === cleanB) return true;

  // 2. Substring containment if sufficiently long
  if (cleanA.length > 12 && cleanB.length > 12) {
    if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;
  }

  // 3. Keyword token overlap
  const tokensA = extractSignificantTokens(strA);
  const tokensB = extractSignificantTokens(strB);

  if (tokensA.length >= 2 && tokensB.length >= 2) {
    const overlap = tokensA.filter((t) => tokensB.includes(t));
    const minLen = Math.min(tokensA.length, tokensB.length);
    const overlapRatio = overlap.length / minLen;

    if (overlapRatio >= 0.70) {
      return true;
    }
  }

  return false;
}

/**
 * Merges and normalizes multiple lists of client requirements (clientWants).
 * Preserves distinct requirements while eliminating duplicates and keeping richer descriptions.
 */
export function mergeClientRequirements(existingWants: string[] = [], newWants: string[] = []): string[] {
  const merged: string[] = [...existingWants];

  for (const newWant of newWants) {
    if (!newWant || !newWant.trim()) continue;
    const trimmed = newWant.trim();

    const existingIdx = merged.findIndex((existing) => areSemanticallyEquivalent(existing, trimmed));

    if (existingIdx !== -1) {
      // If the new version is more descriptive (longer and has more detail), replace it with the richer version
      if (trimmed.length > merged[existingIdx].length + 5) {
        merged[existingIdx] = trimmed;
      }
    } else {
      merged.push(trimmed);
    }
  }

  return merged;
}

/**
 * Merges and normalizes lists of technical skills, tools, and competencies.
 * Uses generic normalization and alias mapping.
 */
export function mergeRequiredSkills(existingSkills: string[] = [], newSkills: string[] = []): string[] {
  const canonicalMap = new Map<string, string>(); // canonical normalized key -> formatted display skill

  const addSkill = (rawSkill: string) => {
    if (!rawSkill || !rawSkill.trim()) return;
    const trimmed = rawSkill.trim();
    const normalizedKey = normalizeSkill(trimmed);
    if (!normalizedKey) return;

    if (!canonicalMap.has(normalizedKey)) {
      canonicalMap.set(normalizedKey, trimmed);
    } else {
      // Prefer capitalized/properly formatted version if available
      const existingDisplay = canonicalMap.get(normalizedKey)!;
      if (trimmed !== trimmed.toLowerCase() && existingDisplay === existingDisplay.toLowerCase()) {
        canonicalMap.set(normalizedKey, trimmed);
      }
    }
  };

  existingSkills.forEach(addSkill);
  newSkills.forEach(addSkill);

  return Array.from(canonicalMap.values());
}

/**
 * Merges and deduplicates lists of clarifying questions.
 */
export function mergeClarificationQuestions(existingQuestions: string[] = [], newQuestions: string[] = []): string[] {
  const merged: string[] = [...existingQuestions];

  for (const newQ of newQuestions) {
    if (!newQ || !newQ.trim()) continue;
    const trimmed = newQ.trim();

    const existingIdx = merged.findIndex((existing) => areSemanticallyEquivalent(existing, trimmed));

    if (existingIdx !== -1) {
      if (trimmed.length > merged[existingIdx].length) {
        merged[existingIdx] = trimmed;
      }
    } else {
      merged.push(trimmed);
    }
  }

  return merged;
}

/**
 * Merges detected deliverables/scope items across all screenshot analyses.
 */
export function mergeDetectedDeliverables(
  itemLists: Array<Array<{ name: string; qty?: number }>>
): Array<{ name: string; qty: number }> {
  const mergedMap = new Map<string, { name: string; qty: number }>();

  for (const items of itemLists) {
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      if (!item || !item.name || !item.name.trim()) continue;
      const rawName = item.name.replace(/\s*\(x\d+\)$/, '').trim();
      const qty = Math.max(1, Math.round(item.qty || 1));

      // Check if already in map by normalized key
      let matchedKey: string | null = null;
      for (const existingKey of mergedMap.keys()) {
        if (areSemanticallyEquivalent(existingKey, rawName)) {
          matchedKey = existingKey;
          break;
        }
      }

      if (matchedKey) {
        const existingRecord = mergedMap.get(matchedKey)!;
        // Keep highest or accumulated quantity
        existingRecord.qty = Math.max(existingRecord.qty, qty);
        // Prefer more descriptive name
        if (rawName.length > existingRecord.name.length) {
          existingRecord.name = rawName;
        }
      } else {
        mergedMap.set(rawName, { name: rawName, qty });
      }
    }
  }

  return Array.from(mergedMap.values());
}

export interface IMergedAnalysisOutput {
  capability: 'supported' | 'partially_supported' | 'not_supported';
  clientWants: string[];
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  questionsToClarify: string[];
  scopeComplexity: 'low' | 'medium' | 'high';
  detectedItems: Array<{ name: string; qty: number }>;
  pricingEstimate: {
    minPrice: number;
    maxPrice: number;
    deliveryDays: number;
    currency: string;
    breakdown: any[];
  };
  extractedMessageText: string;
  analyzedAt: string;
}

/**
 * Generic, profession-neutral merge engine for combining multiple screenshot analyses.
 */
export function mergeCumulativeAnalyses(params: {
  allAnalyses: IRequirementExtraction[];
  userProfile: any;
}): IMergedAnalysisOutput {
  const { allAnalyses, userProfile } = params;

  if (!allAnalyses || allAnalyses.length === 0) {
    return {
      capability: 'supported',
      clientWants: [],
      requiredSkills: [],
      matchedSkills: [],
      missingSkills: [],
      questionsToClarify: [],
      scopeComplexity: 'medium',
      detectedItems: [],
      pricingEstimate: {
        minPrice: userProfile?.pricingRules?.minProjectPrice || 0,
        maxPrice: userProfile?.pricingRules?.minProjectPrice || 0,
        deliveryDays: 3,
        currency: userProfile?.pricingRules?.currency || 'USD',
        breakdown: [],
      },
      extractedMessageText: '',
      analyzedAt: new Date().toISOString(),
    };
  }

  // 1. Merge client requirements across all analyses
  let cumulativeWants: string[] = [];
  for (const a of allAnalyses) {
    cumulativeWants = mergeClientRequirements(cumulativeWants, a.clientWants || []);
  }

  // 2. Merge required skills across all analyses
  let cumulativeSkills: string[] = [];
  for (const a of allAnalyses) {
    cumulativeSkills = mergeRequiredSkills(cumulativeSkills, a.extractedSkillsRequired || []);
  }

  // 3. Match cumulative skills against user profile
  const skillMatch: ISkillMatchResult = matchSkills(
    cumulativeSkills,
    userProfile?.skills || [],
    userProfile?.unsupportedWork || [],
    userProfile?.supportedWork || [],
    userProfile?.toolsAndFrameworks || []
  );

  // 4. Merge questions to clarify
  let cumulativeQuestions: string[] = [];
  for (const a of allAnalyses) {
    cumulativeQuestions = mergeClarificationQuestions(cumulativeQuestions, a.informationToClarify || []);
  }

  // 5. Merge detected items
  const allDetectedItemLists = allAnalyses.map((a) => a.detectedItems || []);
  const cumulativeDetectedItems = mergeDetectedDeliverables(allDetectedItemLists);

  // 6. Compute cumulative complexity
  let highestComplexity: 'low' | 'medium' | 'high' = 'low';
  const hasHigh = allAnalyses.some((a) => a.scopeComplexity === 'high');
  const hasMedium = allAnalyses.some((a) => a.scopeComplexity === 'medium');

  if (hasHigh || cumulativeDetectedItems.length >= 5) {
    highestComplexity = 'high';
  } else if (hasMedium || cumulativeDetectedItems.length >= 3) {
    highestComplexity = 'medium';
  } else {
    highestComplexity = 'low';
  }

  // 7. Calculate combined pricing & delivery days
  const pricingResult: IPricingEngineResult = calculatePricing(
    cumulativeDetectedItems,
    highestComplexity,
    userProfile?.services || [],
    userProfile?.pricingRules
  );

  // Add any unpriced questions to clarifications
  if (pricingResult.unpricedQuestions && pricingResult.unpricedQuestions.length > 0) {
    cumulativeQuestions = mergeClarificationQuestions(cumulativeQuestions, pricingResult.unpricedQuestions);
  }

  // 8. Combine extracted message texts
  const distinctTranscripts: string[] = [];
  allAnalyses.forEach((a, idx) => {
    const text = (a.extractedMessageText || '').trim();
    if (text && !distinctTranscripts.some((t) => areSemanticallyEquivalent(t, text))) {
      distinctTranscripts.push(text);
    }
  });

  const finalTranscribedText = distinctTranscripts.length > 1
    ? distinctTranscripts.map((t, i) => `[Screenshot #${i + 1} Extracted Text]:\n${t}`).join('\n\n')
    : distinctTranscripts[0] || '';

  return {
    capability: skillMatch.capabilityStatus,
    clientWants: cumulativeWants,
    requiredSkills: cumulativeSkills,
    matchedSkills: skillMatch.matchedSkills,
    missingSkills: skillMatch.missingSkills,
    questionsToClarify: cumulativeQuestions,
    scopeComplexity: highestComplexity,
    detectedItems: cumulativeDetectedItems,
    pricingEstimate: {
      minPrice: pricingResult.minPrice,
      maxPrice: pricingResult.maxPrice,
      deliveryDays: pricingResult.deliveryDays,
      currency: pricingResult.currency,
      breakdown: pricingResult.breakdown,
    },
    extractedMessageText: finalTranscribedText,
    analyzedAt: new Date().toISOString(),
  };
}
