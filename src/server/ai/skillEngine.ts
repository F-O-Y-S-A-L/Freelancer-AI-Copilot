export const SKILL_ALIASES: Record<string, string> = {
  'reactjs': 'react',
  'react.js': 'react',
  'react-js': 'react',
  'node': 'node.js',
  'nodejs': 'node.js',
  'node-js': 'node.js',
  'mongodb': 'mongodb',
  'mongo db': 'mongodb',
  'mongo': 'mongodb',
  'tailwindcss': 'tailwind css',
  'tailwind-css': 'tailwind css',
  'tailwind': 'tailwind css',
  'expressjs': 'express.js',
  'express.js': 'express.js',
  'express-js': 'express.js',
  'express': 'express.js',
  'typescript': 'typescript',
  'ts': 'typescript',
  'javascript': 'javascript',
  'js': 'javascript',
  'nextjs': 'next.js',
  'next.js': 'next.js',
  'next-js': 'next.js',
  'vuejs': 'vue.js',
  'vue.js': 'vue.js',
  'vue-js': 'vue.js',
  'vue': 'vue.js',
  'wordpress': 'wordpress',
  'wp': 'wordpress',
  'php': 'php',
  'postgres': 'postgresql',
  'postgresql': 'postgresql',
  'python': 'python',
  'py': 'python',
  'docker': 'docker',
  'aws': 'aws',
  'amazon web services': 'aws',
  'stripe': 'stripe',
  'stripe payment': 'stripe',
  'stripe payments': 'stripe',
};

export function normalizeSkill(skill: string): string {
  if (!skill) return '';
  const cleaned = skill
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\.\-#]/g, '');

  if (SKILL_ALIASES[cleaned]) {
    return SKILL_ALIASES[cleaned];
  }
  return cleaned;
}

export interface ISkillMatchResult {
  matchedSkills: string[];
  missingSkills: string[];
  capabilityStatus: 'supported' | 'partially_supported' | 'not_supported';
}

export function matchSkills(
  extractedSkillsRequired: string[],
  profileSkills: string[] = [],
  profileUnsupportedWork: string[] = [],
  profileSupportedWork: string[] = [],
  toolsAndFrameworks: string[] = []
): ISkillMatchResult {
  const supportedNormalized = [
    ...profileSkills,
    ...profileSupportedWork,
    ...toolsAndFrameworks,
  ].map((s) => normalizeSkill(s)).filter(Boolean);

  const unsupportedNormalized = profileUnsupportedWork
    .map((s) => normalizeSkill(s))
    .filter(Boolean);

  const matchedSkillsSet = new Set<string>();
  const missingSkillsSet = new Set<string>();
  let requiredAnExplicitlyUnsupportedSkill = false;

  for (const rawReq of extractedSkillsRequired) {
    const normReq = normalizeSkill(rawReq);
    if (!normReq) continue;

    // Check if explicitly unsupported
    const isUnsupported = unsupportedNormalized.some(
      (un) => un === normReq || normReq.includes(un) || un.includes(normReq)
    );

    if (isUnsupported) {
      missingSkillsSet.add(rawReq);
      requiredAnExplicitlyUnsupportedSkill = true;
      continue;
    }

    // Check if supported
    const isSupported = supportedNormalized.some(
      (sup) => sup === normReq || normReq.includes(sup) || sup.includes(normReq)
    );

    if (isSupported) {
      matchedSkillsSet.add(rawReq);
    } else {
      missingSkillsSet.add(rawReq);
    }
  }

  const matchedSkills = Array.from(matchedSkillsSet);
  const missingSkills = Array.from(missingSkillsSet);

  let capabilityStatus: 'supported' | 'partially_supported' | 'not_supported';

  if (requiredAnExplicitlyUnsupportedSkill) {
    if (matchedSkills.length > 0) {
      capabilityStatus = 'partially_supported';
    } else {
      capabilityStatus = 'not_supported';
    }
  } else if (extractedSkillsRequired.length > 0 && matchedSkills.length === 0) {
    capabilityStatus = 'not_supported';
  } else if (missingSkills.length > 0) {
    capabilityStatus = 'partially_supported';
  } else {
    capabilityStatus = 'supported';
  }

  return {
    matchedSkills,
    missingSkills,
    capabilityStatus,
  };
}
