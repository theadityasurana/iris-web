/**
 * Career families and how skills transfer between them.
 *
 * The feed shows a user's own roles first, but people are realistically
 * employable in neighbouring careers too (a backend engineer in AI or data
 * roles, a consultant in product management, …). Each family lists the
 * families it transfers to, closest first, and the titles that represent it
 * in job search. Families mirror the onboarding categories in
 * constants/roles.ts so every selectable role belongs to at least one.
 */
import { CATEGORY_ROLES } from '@/constants/roles';

export type RoleFamily =
  | 'software_engineering' | 'data' | 'ai_ml' | 'security' | 'misc_engineering'
  | 'product' | 'consulting' | 'design' | 'finance' | 'marketing' | 'sales'
  | 'human_resources' | 'operations' | 'healthcare' | 'legal' | 'customer_success';

interface FamilyDef {
  /** Families whose roles this family's people can also do, closest first. */
  adjacent: RoleFamily[];
  /**
   * Phrases that identify a free-text role (one not in the onboarding list)
   * as this family. Matched as title phrases, like search_jobs does.
   */
  cues: string[];
  /** Broad titles added to the family's onboarding roles when searching. */
  generalTitles: string[];
}

export const ROLE_FAMILIES: Record<RoleFamily, FamilyDef> = {
  software_engineering: {
    adjacent: ['ai_ml', 'data', 'security', 'product'],
    cues: ['software', 'developer', 'programmer', 'backend', 'back end', 'frontend', 'front end', 'full stack', 'fullstack', 'web', 'mobile', 'ios', 'android', 'devops', 'site reliability', 'sre', 'platform engineer', 'infrastructure engineer', 'cloud engineer', 'qa', 'test engineer', 'sdet', 'game', 'embedded', 'firmware', 'systems engineer', 'api engineer', 'blockchain'],
    generalTitles: ['Software Engineer', 'Software Developer', 'Web Developer', 'Application Engineer'],
  },
  data: {
    adjacent: ['ai_ml', 'software_engineering', 'consulting', 'product'],
    cues: ['data', 'analyst', 'analytics', 'business intelligence', 'bi', 'statistic', 'quantitative', 'insights', 'decision scientist', 'research scientist', 'applied scientist'],
    generalTitles: ['Data Analyst', 'Data Scientist', 'Data Engineer', 'Analytics Engineer'],
  },
  ai_ml: {
    adjacent: ['data', 'software_engineering', 'product'],
    cues: ['machine learning', 'ml', 'ai', 'artificial intelligence', 'deep learning', 'nlp', 'computer vision', 'llm', 'generative', 'prompt', 'mlops', 'reinforcement learning', 'speech', 'recommendation'],
    generalTitles: ['Machine Learning Engineer', 'AI Engineer', 'Applied Scientist', 'Research Scientist'],
  },
  security: {
    adjacent: ['software_engineering', 'consulting'],
    cues: ['security', 'cyber', 'penetration', 'soc', 'threat', 'vulnerability', 'forensic', 'malware', 'red team', 'blue team', 'grc', 'iam', 'identity', 'ciso', 'cryptograph', 'devsecops', 'incident response'],
    generalTitles: ['Security Engineer', 'Security Analyst'],
  },
  misc_engineering: {
    adjacent: ['software_engineering', 'operations'],
    cues: ['mechanical', 'electrical', 'civil', 'chemical', 'aerospace', 'environmental engineer', 'industrial engineer', 'materials', 'nuclear', 'petroleum', 'structural', 'manufacturing', 'automation', 'control systems', 'rf', 'optical', 'hardware', 'reliability engineer', 'validation engineer', 'process engineer'],
    generalTitles: ['Mechanical Engineer', 'Electrical Engineer', 'Hardware Engineer', 'Manufacturing Engineer'],
  },
  product: {
    adjacent: ['consulting', 'operations', 'design', 'data', 'marketing'],
    cues: ['product manager', 'product owner', 'product lead', 'product management', 'chief product', 'head of product', 'vp of product', 'product strategy', 'product operations'],
    generalTitles: ['Product Manager', 'Product Owner', 'Technical Product Manager'],
  },
  consulting: {
    adjacent: ['product', 'operations', 'finance', 'data'],
    cues: ['consultant', 'consulting', 'advisory', 'engagement manager', 'due diligence', 'business analyst'],
    generalTitles: ['Consultant', 'Management Consultant', 'Strategy Consultant', 'Business Analyst'],
  },
  design: {
    adjacent: ['product', 'marketing'],
    cues: ['designer', 'design', 'ux', 'ui', 'illustrator', 'creative director', 'visual', 'interaction', 'user research'],
    generalTitles: ['Product Designer', 'UX Designer', 'UI Designer', 'Graphic Designer'],
  },
  finance: {
    adjacent: ['consulting', 'data', 'operations'],
    cues: ['finance', 'financial', 'accountant', 'accounting', 'auditor', 'audit', 'fp&a', 'treasury', 'tax', 'credit', 'investment', 'equity', 'portfolio', 'venture', 'private equity', 'controller', 'cfo', 'payroll', 'actuar', 'trader', 'banking'],
    generalTitles: ['Financial Analyst', 'Accountant', 'Finance Manager'],
  },
  marketing: {
    adjacent: ['sales', 'product', 'design', 'customer_success'],
    cues: ['marketing', 'seo', 'social media', 'brand', 'content', 'copywriter', 'demand generation', 'growth', 'cmo', 'community', 'pr', 'communications', 'influencer', 'affiliate', 'paid media', 'email marketing'],
    generalTitles: ['Marketing Manager', 'Marketing Specialist', 'Growth Marketing Manager'],
  },
  sales: {
    adjacent: ['customer_success', 'marketing', 'consulting'],
    cues: ['sales', 'account executive', 'business development', 'bdr', 'sdr', 'account manager', 'revenue', 'territory', 'channel', 'pre-sales', 'presales', 'solutions consultant', 'chief revenue'],
    generalTitles: ['Account Executive', 'Sales Manager', 'Business Development Representative', 'Account Manager'],
  },
  human_resources: {
    adjacent: ['operations', 'consulting'],
    cues: ['hr', 'human resources', 'recruiter', 'recruiting', 'talent', 'people', 'compensation', 'benefits', 'learning & development', 'l&d', 'employee', 'payroll specialist', 'hris', 'workforce', 'onboarding specialist'],
    generalTitles: ['Recruiter', 'HR Business Partner', 'People Operations Manager', 'HR Generalist'],
  },
  operations: {
    adjacent: ['consulting', 'product', 'finance', 'human_resources'],
    cues: ['operations', 'strategy', 'program manager', 'project manager', 'chief of staff', 'supply chain', 'logistics', 'procurement', 'vendor', 'facilities', 'coo', 'scrum master', 'agile coach', 'inventory', 'six sigma', 'business process'],
    generalTitles: ['Operations Manager', 'Program Manager', 'Project Manager', 'Business Operations Manager'],
  },
  healthcare: {
    adjacent: ['data', 'consulting', 'operations'],
    cues: ['clinical', 'health', 'medical', 'biomedical', 'pharma', 'regulatory affairs', 'epidemiolog', 'biostatistic', 'nursing', 'lab technician', 'telemedicine'],
    generalTitles: ['Clinical Research Associate', 'Healthcare Data Analyst', 'Biomedical Engineer'],
  },
  legal: {
    adjacent: ['consulting', 'human_resources'],
    cues: ['legal', 'lawyer', 'attorney', 'counsel', 'paralegal', 'compliance', 'contract', 'privacy', 'litigation', 'patent', 'regulatory counsel'],
    generalTitles: ['Legal Counsel', 'Compliance Analyst', 'Paralegal', 'Contract Manager'],
  },
  customer_success: {
    adjacent: ['sales', 'operations', 'marketing'],
    cues: ['customer', 'client', 'support', 'help desk', 'technical account manager', 'implementation', 'onboarding manager', 'renewals', 'escalation', 'service delivery'],
    generalTitles: ['Customer Success Manager', 'Technical Account Manager', 'Implementation Specialist', 'Customer Support Specialist'],
  },
};

export const FAMILY_KEYS = Object.keys(ROLE_FAMILIES) as RoleFamily[];

/** Searchable titles for a family: broad titles first, then its onboarding roles. */
export function familyTitles(family: RoleFamily): string[] {
  return [...ROLE_FAMILIES[family].generalTitles, ...(CATEGORY_ROLES[family] ?? [])];
}
