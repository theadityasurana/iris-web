export const ROLE_CATEGORIES = [
  { key: 'software_engineering', label: 'Software Engineering', emoji: '', color: '#3B82F6' },
  { key: 'data', label: 'Data & Analytics', emoji: '', color: '#8B5CF6' },
  { key: 'security', label: 'Cybersecurity', emoji: '', color: '#DC2626' },
  { key: 'misc_engineering', label: 'Engineering', emoji: '', color: '#78716C' },
  { key: 'ai_ml', label: 'AI & Machine Learning', emoji: '', color: '#06B6D4' },
  { key: 'product', label: 'Product', emoji: '', color: '#0EA5E9' },
  { key: 'consulting', label: 'Consulting', emoji: '', color: '#14B8A6' },
  { key: 'design', label: 'Design', emoji: '', color: '#EC4899' },
  { key: 'finance', label: 'Finance', emoji: '', color: '#10B981' },
  { key: 'marketing', label: 'Marketing', emoji: '', color: '#F97316' },
  { key: 'sales', label: 'Sales', emoji: '', color: '#22C55E' },
  { key: 'human_resources', label: 'Human Resources', emoji: '', color: '#F59E0B' },
  { key: 'operations', label: 'Operations & Strategy', emoji: '', color: '#64748B' },
  { key: 'healthcare', label: 'Healthcare', emoji: '', color: '#EF4444' },
  { key: 'legal', label: 'Legal', emoji: '', color: '#6366F1' },
  { key: 'customer_success', label: 'Customer Success', emoji: '', color: '#A855F7' },
];

export const CATEGORY_ROLES: Record<string, string[]> = {
  software_engineering: [
    'Backend Engineer', 'Frontend Engineer', 'Full Stack Engineer', 'Mobile Engineer (iOS)',
    'Mobile Engineer (Android)', 'React Native Developer', 'Blockchain Engineer', 'Cloud Engineer',
    'Developer Relations', 'DevOps Engineer', 'Embedded Engineer', 'Firmware Engineer',
    'Game Developer', 'Graphics Engineer', 'Platform Engineer',
    'QA / Test Engineer', 'Robotics Engineer', 'Site Reliability Engineer', 'Systems Engineer',
    'Software Architect', 'API Engineer', 'Database Engineer', 'Infrastructure Engineer',
    'Performance Engineer',
  ],
  data: [
    'Data Analyst', 'Data Scientist', 'Data Engineer', 'Business Intelligence Analyst',
    'Analytics Engineer', 'Data Architect', 'Quantitative Analyst',
    'Data Operations Manager', 'Statistical Analyst', 'Data Visualization Specialist',
    'Big Data Engineer', 'Decision Scientist', 'Data Governance Analyst',
    'Research Scientist', 'Applied Scientist', 'Predictive Modeler',
    'Business Analyst', 'Revenue Analyst', 'Operations Analyst',
    'Insights Analyst', 'Product Analyst', 'Marketing Analyst',
  ],
  ai_ml: [
    'Machine Learning Engineer', 'AI Research Scientist', 'Deep Learning Engineer',
    'NLP Engineer', 'Computer Vision Engineer', 'MLOps Engineer',
    'AI Product Manager', 'Prompt Engineer', 'AI Safety Researcher',
    'Reinforcement Learning Engineer', 'Generative AI Engineer', 'AI Ethics Researcher',
    'Conversational AI Developer', 'AI Infrastructure Engineer', 'Robotics ML Engineer',
    'Speech Recognition Engineer', 'Recommendation Systems Engineer', 'AI Solutions Architect',
    'LLM Engineer', 'AI Trainer / Annotator', 'Knowledge Graph Engineer',
    'Autonomous Systems Engineer',
  ],
  security: [
    'Security Engineer', 'Cybersecurity Analyst', 'Penetration Tester',
    'Security Architect', 'SOC Analyst', 'Threat Intelligence Analyst',
    'Application Security Engineer', 'Cloud Security Engineer',
    'Identity & Access Management Specialist', 'Security Operations Manager',
    'CISO', 'Incident Response Analyst', 'Vulnerability Analyst',
    'Compliance Analyst', 'Forensics Analyst', 'Red Team Engineer',
    'Blue Team Engineer', 'GRC Analyst', 'Security Consultant',
    'Malware Analyst', 'Cryptographer', 'DevSecOps Engineer',
  ],
  misc_engineering: [
    'Mechanical Engineer', 'Electrical Engineer', 'Civil Engineer',
    'Chemical Engineer', 'Aerospace Engineer', 'Environmental Engineer',
    'Industrial Engineer', 'Materials Engineer', 'Nuclear Engineer',
    'Petroleum Engineer', 'Structural Engineer', 'Manufacturing Engineer',
    'Automation Engineer', 'Control Systems Engineer', 'RF Engineer',
    'Optical Engineer', 'Audio Engineer', 'Test Engineer',
    'Reliability Engineer', 'Validation Engineer', 'Process Engineer',
    'Packaging Engineer',
  ],
  product: [
    'Product Manager', 'Senior Product Manager', 'Technical Product Manager',
    'Product Owner', 'VP of Product', 'Chief Product Officer',
    'Product Analyst', 'Product Operations Manager', 'Growth Product Manager',
    'Platform Product Manager', 'Product Marketing Manager', 'Product Designer',
    'Product Strategy Lead', 'Associate Product Manager', 'Staff Product Manager',
    'Principal Product Manager', 'Product Data Analyst', 'Product Researcher',
    'Product Enablement Manager', 'Product Partnerships Manager',
    'AI Product Manager', 'B2B Product Manager',
  ],
  consulting: [
    'Management Consultant', 'Strategy Consultant', 'Technology Consultant',
    'Business Analyst', 'Operations Consultant', 'Financial Advisory Consultant',
    'HR Consultant', 'IT Consultant', 'Risk Consultant', 'Supply Chain Consultant',
    'Digital Transformation Consultant', 'Change Management Consultant',
    'Healthcare Consultant', 'Sustainability Consultant', 'Data Consultant',
    'M&A Advisory', 'Pricing Consultant', 'Implementation Consultant',
    'Process Improvement Consultant', 'Internal Consultant', 'Due Diligence Analyst',
    'Engagement Manager',
  ],
  design: [
    'UX Designer', 'UI Designer', 'Product Designer', 'Graphic Designer',
    'Brand Designer', 'Motion Designer', 'Interaction Designer', 'Visual Designer',
    'Design Systems Designer', 'UX Researcher', 'Content Designer',
    'Service Designer', 'Design Lead', 'Creative Director', 'Illustrator',
    'Web Designer', '3D Designer', 'Design Ops Manager', 'Accessibility Designer',
    'Design Strategist', 'Industrial Designer', 'Packaging Designer',
  ],
  finance: [
    'Financial Analyst', 'Investment Banking Analyst', 'Accountant', 'Auditor',
    'FP&A Analyst', 'Treasury Analyst', 'Tax Analyst', 'Credit Analyst',
    'Portfolio Manager', 'Risk Analyst', 'Equity Research Analyst',
    'Venture Capital Analyst', 'Private Equity Associate', 'CFO',
    'Controller', 'Revenue Analyst', 'Billing Specialist', 'Payroll Manager',
    'Financial Planner', 'Actuary', 'Quantitative Trader', 'Fund Accountant',
  ],
  marketing: [
    'Marketing Manager', 'Digital Marketing Manager', 'Content Marketing Manager',
    'Growth Marketing Manager', 'Performance Marketing Manager', 'SEO Specialist',
    'Social Media Manager', 'Brand Manager', 'Email Marketing Specialist',
    'Marketing Analyst', 'Demand Generation Manager', 'Content Strategist',
    'Copywriter', 'Marketing Operations Manager', 'Influencer Marketing Manager',
    'Affiliate Marketing Manager', 'Product Marketing Manager', 'CMO',
    'Community Manager', 'PR Manager', 'Event Marketing Manager',
    'Paid Media Specialist',
  ],
  sales: [
    'Sales Representative', 'Account Executive', 'Sales Manager',
    'Business Development Representative', 'Sales Director', 'VP of Sales',
    'Inside Sales Representative', 'Outside Sales Representative',
    'Sales Engineer', 'Solutions Consultant', 'Enterprise Account Executive',
    'Account Manager', 'Sales Operations Manager', 'Revenue Operations Manager',
    'Channel Sales Manager', 'Regional Sales Manager', 'Sales Enablement Manager',
    'Pre-Sales Consultant', 'Key Account Manager', 'Territory Manager',
    'Chief Revenue Officer', 'Sales Trainer',
  ],
  human_resources: [
    'HR Generalist', 'Recruiter', 'Technical Recruiter', 'Talent Acquisition Manager',
    'HR Business Partner', 'People Operations Manager', 'Compensation & Benefits Analyst',
    'Learning & Development Specialist', 'Employee Relations Manager',
    'Diversity & Inclusion Manager', 'HR Analyst', 'Onboarding Specialist',
    'Employer Branding Manager', 'Workforce Planning Analyst', 'HRIS Analyst',
    'Chief People Officer', 'HR Director', 'Organizational Development Specialist',
    'Talent Management Specialist', 'Payroll Specialist', 'HR Coordinator',
    'Executive Recruiter',
  ],
  operations: [
    'Operations Manager', 'Strategy Analyst', 'Business Operations Manager',
    'Program Manager', 'Project Manager', 'Chief of Staff',
    'Supply Chain Manager', 'Logistics Coordinator', 'Process Engineer',
    'Lean Six Sigma Specialist', 'Vendor Manager', 'Procurement Specialist',
    'Facilities Manager', 'COO', 'Strategy & Operations Lead',
    'Business Process Analyst', 'Capacity Planner', 'Quality Assurance Manager',
    'Inventory Manager', 'Fleet Manager', 'Scrum Master', 'Agile Coach',
  ],
  healthcare: [
    'Clinical Data Manager', 'Health Informatics Specialist', 'Biomedical Engineer',
    'Clinical Research Associate', 'Healthcare Consultant', 'Medical Science Liaison',
    'Pharmaceutical Sales Rep', 'Regulatory Affairs Specialist', 'Health IT Analyst',
    'Telemedicine Coordinator', 'Clinical Operations Manager', 'Medical Writer',
    'Pharmacovigilance Specialist', 'Healthcare Data Analyst', 'Nursing Informatics Specialist',
    'Public Health Analyst', 'Epidemiologist', 'Health Policy Analyst', 'Lab Technician',
    'Biostatistician', 'Clinical Trial Manager', 'Medical Device Engineer',
  ],
  legal: [
    'Corporate Lawyer', 'Compliance Officer', 'Legal Counsel', 'Paralegal',
    'Contract Manager', 'IP Attorney', 'Privacy Counsel', 'Litigation Associate',
    'Legal Operations Manager', 'Regulatory Counsel', 'Employment Lawyer',
    'Tax Attorney', 'M&A Lawyer', 'Legal Analyst', 'General Counsel',
    'Patent Agent', 'Legal Tech Specialist', 'Risk & Compliance Analyst',
    'Immigration Attorney', 'Real Estate Lawyer', 'Securities Lawyer',
    'Environmental Lawyer',
  ],
  customer_success: [
    'Customer Success Manager', 'Customer Support Specialist', 'Support Engineer',
    'Technical Account Manager', 'Customer Experience Manager',
    'Implementation Specialist', 'Onboarding Manager', 'Client Relations Manager',
    'Customer Advocacy Manager', 'Renewals Manager', 'Customer Operations Analyst',
    'Support Team Lead', 'Customer Education Specialist', 'Community Manager',
    'Voice of Customer Analyst', 'Customer Insights Analyst', 'Help Desk Analyst',
    'Escalation Manager', 'Customer Retention Specialist', 'Service Delivery Manager',
    'Customer Health Analyst', 'Solutions Architect',
  ],
};

export function getRolesGroupedByCategory(selectedRoles: string[]): { key: string; label: string; emoji: string; color: string; roles: string[] }[] {
  const groups: { key: string; label: string; emoji: string; color: string; roles: string[] }[] = [];
  for (const cat of ROLE_CATEGORIES) {
    const catRoles = CATEGORY_ROLES[cat.key] || [];
    const matched = selectedRoles.filter(r => catRoles.includes(r));
    if (matched.length > 0) {
      groups.push({ ...cat, roles: matched });
    }
  }
  // Any roles not in any category
  const allCatRoles = Object.values(CATEGORY_ROLES).flat();
  const uncategorized = selectedRoles.filter(r => !allCatRoles.includes(r));
  if (uncategorized.length > 0) {
    groups.push({ key: 'other', label: 'Other', emoji: '', color: '#9CA3AF', roles: uncategorized });
  }
  return groups;
}
