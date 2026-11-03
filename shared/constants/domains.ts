export interface DomainGroup {
  domain: string;
  keywords: string[];
}

export const DOMAIN_GROUPS: DomainGroup[] = [
  // ─── SOFTWARE & ENGINEERING ───
  {
    domain: 'Software Engineering',
    keywords: ['software engineer', 'software developer', 'SDE', 'backend engineer', 'frontend engineer', 'full stack', 'fullstack', 'web developer', 'application engineer', 'platform engineer', 'systems engineer', 'staff engineer', 'principal engineer', 'senior engineer', 'engineering manager', 'tech lead', 'developer', 'programmer', 'node.js', 'react engineer', 'angular', 'vue', 'python developer', 'java developer', 'golang', 'rust engineer', 'C++ engineer', 'typescript', '.NET developer', 'ruby developer', 'PHP developer', 'scala', 'kotlin developer', 'swift developer', 'microservices', 'API engineer', 'distributed systems', 'software architect', 'code', 'coding', 'engineering director', 'VP engineering', 'head of engineering', 'CTO', 'chief technology officer'],
  },
  {
    domain: 'Frontend Development',
    keywords: ['frontend', 'front-end', 'front end', 'UI engineer', 'web engineer', 'react', 'react.js', 'next.js', 'angular', 'vue.js', 'svelte', 'javascript engineer', 'typescript engineer', 'CSS', 'HTML', 'web developer', 'browser engineer', 'client-side', 'web platform', 'web performance', 'accessibility engineer', 'design engineer', 'UI developer'],
  },
  {
    domain: 'Backend Development',
    keywords: ['backend', 'back-end', 'back end', 'server-side', 'API engineer', 'API developer', 'microservices', 'distributed systems', 'node.js', 'express', 'python engineer', 'django', 'flask', 'java engineer', 'spring boot', 'golang', 'go engineer', 'rust engineer', 'C++ engineer', 'scala', 'elixir', 'infrastructure engineer', 'platform engineer', 'services engineer', 'systems engineer'],
  },
  {
    domain: 'Mobile Development',
    keywords: ['mobile', 'iOS', 'android', 'react native', 'flutter', 'swift', 'kotlin', 'mobile engineer', 'app developer', 'mobile developer', 'cross-platform', 'mobile platform', 'mobile infrastructure', 'mobile SDK', 'objective-c', 'xamarin', 'mobile architect'],
  },
  {
    domain: 'DevOps & SRE',
    keywords: ['devops', 'SRE', 'site reliability', 'infrastructure engineer', 'cloud engineer', 'platform engineer', 'kubernetes', 'k8s', 'docker', 'terraform', 'ansible', 'CI/CD', 'continuous integration', 'continuous delivery', 'deployment', 'reliability engineer', 'production engineer', 'systems administrator', 'sysadmin', 'linux', 'unix', 'AWS engineer', 'GCP engineer', 'Azure engineer', 'cloud infrastructure', 'observability', 'monitoring', 'grafana', 'prometheus', 'datadog', 'infrastructure as code', 'IaC', 'helm', 'ArgoCD', 'Jenkins', 'GitOps'],
  },
  {
    domain: 'Artificial Intelligence & Machine Learning',
    keywords: ['AI', 'artificial intelligence', 'machine learning', 'ML engineer', 'deep learning', 'neural network', 'NLP', 'natural language processing', 'computer vision', 'LLM', 'large language model', 'generative AI', 'GenAI', 'GPT', 'transformer', 'reinforcement learning', 'data scientist', 'applied scientist', 'research scientist', 'ML ops', 'MLOps', 'AI engineer', 'AI researcher', 'prompt engineer', 'AI safety', 'alignment', 'model training', 'inference', 'AI platform', 'AI product', 'AI deployment', 'conversational AI', 'chatbot', 'recommendation system', 'search quality', 'ranking', 'personalization', 'AI agent', 'agentic', 'autonomous agent', 'fine-tuning', 'pre-training', 'post-training', 'RLHF', 'evaluation', 'evals', 'AI infrastructure', 'GPU', 'CUDA', 'PyTorch', 'TensorFlow', 'JAX', 'Hugging Face', 'diffusion', 'stable diffusion', 'image generation', 'text generation', 'speech recognition', 'ASR', 'TTS', 'text to speech', 'multimodal', 'foundation model', 'AI research', 'applied AI', 'responsible AI'],
  },
  {
    domain: 'Data Science & Analytics',
    keywords: ['data scientist', 'data science', 'data analyst', 'data analytics', 'analytics', 'business intelligence', 'BI', 'business analyst', 'statistical', 'statistics', 'quantitative analyst', 'predictive modeling', 'data visualization', 'tableau', 'power BI', 'looker', 'A/B testing', 'experimentation', 'causal inference', 'forecasting', 'recommendation', 'insights', 'metrics', 'KPI', 'reporting', 'dashboard', 'SQL analyst', 'analytics engineer', 'product analyst', 'growth analyst', 'marketing analyst', 'financial analyst', 'risk analyst', 'decision scientist', 'applied scientist'],
  },
  {
    domain: 'Data Engineering',
    keywords: ['data engineer', 'data engineering', 'data pipeline', 'ETL', 'ELT', 'data warehouse', 'data lake', 'data lakehouse', 'big data', 'spark', 'hadoop', 'kafka', 'airflow', 'dbt', 'snowflake', 'databricks', 'redshift', 'BigQuery', 'data platform', 'data infrastructure', 'analytics engineer', 'data ops', 'DataOps', 'streaming', 'real-time data', 'batch processing', 'data modeling', 'data governance', 'data quality', 'data catalog', 'metadata'],
  },
  {
    domain: 'Cybersecurity & Information Security',
    keywords: ['security', 'cybersecurity', 'infosec', 'information security', 'application security', 'appsec', 'product security', 'network security', 'cloud security', 'penetration testing', 'pentest', 'red team', 'blue team', 'purple team', 'SOC', 'security operations', 'threat intelligence', 'threat detection', 'threat hunter', 'vulnerability', 'vulnerability management', 'incident response', 'SIEM', 'GRC', 'governance risk compliance', 'IAM', 'identity', 'access management', 'encryption', 'cryptography', 'PKI', 'offensive security', 'defensive security', 'security engineer', 'CISO', 'security analyst', 'security architect', 'security researcher', 'malware', 'reverse engineering', 'forensics', 'DLP', 'data loss prevention', 'zero trust', 'SASE', 'firewall', 'WAF', 'endpoint security', 'EDR', 'XDR', 'SOAR', 'devsecops', 'security compliance', 'FedRAMP', 'SOC 2', 'ISO 27001', 'NIST'],
  },
  {
    domain: 'Cloud Computing',
    keywords: ['cloud', 'AWS', 'Amazon Web Services', 'Azure', 'Microsoft Azure', 'GCP', 'Google Cloud', 'cloud architect', 'cloud engineer', 'cloud infrastructure', 'serverless', 'lambda', 'cloud native', 'multi-cloud', 'hybrid cloud', 'cloud migration', 'cloud security', 'cloud platform', 'SaaS', 'PaaS', 'IaaS', 'cloud operations', 'cloud cost', 'FinOps', 'cloud networking', 'VPC', 'CDN', 'edge computing', 'cloud storage', 'S3', 'cloud database'],
  },
  {
    domain: 'Database & Storage',
    keywords: ['database', 'DBA', 'database administrator', 'database engineer', 'SQL', 'PostgreSQL', 'MySQL', 'Oracle', 'SQL Server', 'MongoDB', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB', 'data storage', 'storage engineer', 'NoSQL', 'graph database', 'Neo4j', 'time series', 'InfluxDB', 'database reliability', 'database performance', 'data replication', 'sharding'],
  },
  {
    domain: 'QA & Testing',
    keywords: ['QA', 'quality assurance', 'testing', 'test engineer', 'SDET', 'software development engineer in test', 'automation testing', 'manual testing', 'test automation', 'quality engineer', 'QA engineer', 'QA analyst', 'QA lead', 'QA manager', 'test lead', 'performance testing', 'load testing', 'stress testing', 'regression testing', 'integration testing', 'end-to-end testing', 'selenium', 'cypress', 'playwright', 'appium', 'test framework', 'test infrastructure'],
  },
  {
    domain: 'Blockchain & Web3',
    keywords: ['blockchain', 'web3', 'crypto', 'cryptocurrency', 'smart contract', 'solidity', 'DeFi', 'decentralized finance', 'NFT', 'decentralized', 'ethereum', 'bitcoin', 'token', 'wallet', 'dApp', 'consensus', 'ledger', 'stablecoin', 'tokenomics', 'DAO', 'layer 2', 'L2', 'bridge', 'protocol', 'on-chain', 'off-chain', 'web3 security', 'audit', 'MEV'],
  },
  {
    domain: 'Hardware Engineering',
    keywords: ['hardware', 'hardware engineer', 'electrical engineer', 'electronics', 'PCB', 'printed circuit board', 'FPGA', 'ASIC', 'VLSI', 'semiconductor', 'chip design', 'silicon', 'RF engineer', 'RF', 'microwave', 'antenna', 'power electronics', 'embedded systems', 'embedded engineer', 'firmware', 'firmware engineer', 'signal processing', 'DSP', 'analog design', 'digital design', 'RTL', 'RTL design', 'verification engineer', 'design verification', 'DFT', 'physical design', 'layout', 'IC design', 'SoC', 'RFIC', 'mixed signal', 'power systems', 'battery', 'sensor', 'optics', 'optical engineer', 'photonics', 'laser'],
  },
  {
    domain: 'Embedded & Firmware',
    keywords: ['embedded', 'firmware', 'embedded software', 'embedded systems', 'RTOS', 'real-time', 'microcontroller', 'MCU', 'ARM', 'RISC-V', 'bare metal', 'device driver', 'BSP', 'board support', 'IoT', 'internet of things', 'connected devices', 'wearable', 'edge device', 'embedded linux'],
  },
  {
    domain: 'Networking',
    keywords: ['network', 'networking', 'network engineer', 'network architect', 'network security', 'TCP/IP', 'BGP', 'DNS', 'CDN', 'load balancer', 'proxy', 'firewall', 'router', 'switch', 'SD-WAN', 'SASE', 'VPN', 'network operations', 'NOC', 'network automation', 'network performance', 'wireless', 'Wi-Fi', '5G', 'LTE', 'telecom', 'telecommunications', 'ISP', 'optical network', 'fiber'],
  },
  {
    domain: 'Gaming & Game Development',
    keywords: ['game', 'gaming', 'game developer', 'game designer', 'game programmer', 'game engineer', 'unity', 'unreal', 'unreal engine', 'game engine', 'gameplay', 'gameplay engineer', 'level designer', 'narrative designer', 'game artist', 'esports', 'iGaming', 'game producer', 'game QA', 'graphics programmer', 'shader', 'rendering', '3D', 'game server', 'multiplayer', 'online gaming'],
  },
  {
    domain: 'Robotics & Automation',
    keywords: ['robotics', 'robot', 'robotics engineer', 'automation', 'automation engineer', 'controls', 'controls engineer', 'PLC', 'SCADA', 'mechatronics', 'autonomous', 'autonomous vehicle', 'self-driving', 'AV', 'drone', 'UAV', 'industrial automation', 'RPA', 'robotic process automation', 'motion planning', 'perception', 'SLAM', 'computer vision', 'sensor fusion', 'actuator', 'servo', 'cobot'],
  },
  {
    domain: 'AR/VR & Spatial Computing',
    keywords: ['AR', 'VR', 'augmented reality', 'virtual reality', 'mixed reality', 'XR', 'spatial computing', 'metaverse', '3D', 'computer graphics', 'rendering', 'shader', 'OpenGL', 'Vulkan', 'WebXR', 'headset', 'immersive', 'simulation'],
  },
  // ─── PRODUCT & DESIGN ───
  {
    domain: 'Product Management',
    keywords: ['product manager', 'product management', 'PM', 'product owner', 'product lead', 'product director', 'VP product', 'VP of product', 'head of product', 'chief product officer', 'CPO', 'group product manager', 'GPM', 'principal product manager', 'senior product manager', 'associate product manager', 'APM', 'technical product manager', 'TPM', 'product strategy', 'product ops', 'product operations', 'product analyst', 'product growth', 'product marketing manager', 'product roadmap', 'product vision', 'product discovery', 'product-led', 'platform product manager', 'AI product manager', 'data product manager', 'growth product manager', 'monetization product manager'],
  },
  {
    domain: 'Product Design',
    keywords: ['product designer', 'UX designer', 'UI designer', 'UX/UI', 'UI/UX', 'interaction designer', 'visual designer', 'design lead', 'design manager', 'design director', 'VP design', 'head of design', 'chief design officer', 'user experience', 'user interface', 'design systems', 'design engineer', 'design technologist', 'prototyping', 'figma', 'sketch', 'wireframe', 'mockup', 'information architect', 'service designer', 'experience designer', 'design ops', 'design operations', 'accessibility designer', 'inclusive design', 'responsive design'],
  },
  {
    domain: 'UX Research',
    keywords: ['UX researcher', 'user researcher', 'UX research', 'user research', 'usability', 'usability testing', 'user testing', 'research ops', 'research operations', 'qualitative research', 'quantitative research', 'design research', 'insights researcher', 'mixed methods', 'ethnography', 'survey design', 'interview', 'focus group', 'card sorting', 'tree testing', 'heuristic evaluation', 'research scientist'],
  },
  {
    domain: 'Brand & Graphic Design',
    keywords: ['brand designer', 'graphic designer', 'visual designer', 'brand identity', 'brand manager', 'brand strategist', 'brand marketing', 'creative director', 'art director', 'creative lead', 'creative manager', 'illustration', 'illustrator', 'typography', 'logo', 'packaging design', 'print design', 'brand guidelines', 'brand experience'],
  },
  {
    domain: 'Motion & Video',
    keywords: ['motion designer', 'motion graphics', 'animator', 'animation', 'video editor', 'video producer', 'video production', 'videographer', 'cinematographer', 'post-production', 'VFX', 'visual effects', 'after effects', 'premiere', 'final cut', 'colorist', 'sound design', 'audio engineer', 'broadcast engineer', 'streaming'],
  },
  {
    domain: 'Content Design & UX Writing',
    keywords: ['content designer', 'UX writer', 'UX writing', 'content strategist', 'content strategy', 'microcopy', 'information architecture', 'content design', 'conversation designer', 'voice design', 'tone of voice', 'style guide'],
  },
];


// ─── SALES & REVENUE ───

DOMAIN_GROUPS.push(
  {
    domain: 'Sales',
    keywords: ['sales', 'account executive', 'AE', 'account manager', 'sales manager', 'sales director', 'VP sales', 'VP of sales', 'head of sales', 'chief revenue officer', 'CRO', 'enterprise sales', 'commercial sales', 'mid-market sales', 'SMB sales', 'inside sales', 'field sales', 'outside sales', 'sales development', 'SDR', 'sales development representative', 'BDR', 'business development representative', 'sales engineer', 'sales operations', 'sales ops', 'sales strategy', 'sales enablement', 'sales compensation', 'quota', 'territory', 'hunter', 'closer', 'new business', 'expansion', 'upsell', 'cross-sell', 'pipeline', 'forecast', 'deal desk', 'sales planning', 'regional sales', 'district manager', 'area VP', 'sales trainer', 'sales recruiter', 'majors', 'strategic accounts', 'named accounts', 'key accounts', 'global accounts'],
  },
  {
    domain: 'Solutions Engineering & Pre-Sales',
    keywords: ['solutions engineer', 'solutions architect', 'solution consultant', 'solutions consulting', 'pre-sales', 'pre-sales engineer', 'sales engineer', 'technical sales', 'demo engineer', 'field engineer', 'customer engineer', 'technical consultant', 'solutions specialist', 'specialist solutions', 'proof of concept', 'POC', 'technical evaluation', 'RFP', 'proposal engineer', 'overlay', 'field CTO', 'technical advisor'],
  },
  {
    domain: 'Business Development & Partnerships',
    keywords: ['business development', 'BD', 'BDR', 'partnerships', 'partner manager', 'partner director', 'alliance', 'alliances', 'channel', 'channel manager', 'channel sales', 'channel partner', 'strategic partnerships', 'partner development', 'ecosystem', 'partner sales', 'business growth', 'partner marketing', 'partner engineering', 'partner solutions', 'partner operations', 'partner program', 'GSI', 'global system integrator', 'ISV', 'technology partner', 'reseller', 'distributor', 'OEM', 'co-sell', 'marketplace', 'partner enablement', 'partner success'],
  },
  {
    domain: 'Revenue Operations',
    keywords: ['revenue operations', 'RevOps', 'sales operations', 'sales ops', 'GTM operations', 'go-to-market operations', 'deal desk', 'deal pricing', 'sales analytics', 'pipeline analytics', 'forecasting', 'territory planning', 'quota', 'compensation', 'incentive compensation', 'commission', 'CRM', 'salesforce admin', 'salesforce developer', 'HubSpot', 'sales tools', 'sales systems', 'GTM systems', 'GTM strategy', 'revenue strategy', 'order management', 'billing operations', 'renewal', 'renewals manager'],
  },
  {
    domain: 'Customer Success',
    keywords: ['customer success', 'CSM', 'customer success manager', 'client success', 'customer experience', 'CX', 'customer engagement', 'retention', 'churn', 'NPS', 'CSAT', 'onboarding', 'onboarding manager', 'implementation', 'implementation consultant', 'implementation manager', 'customer operations', 'customer advocacy', 'renewal', 'expansion', 'upsell', 'customer health', 'customer journey', 'customer lifecycle', 'scaled success', 'digital success', 'enterprise CSM', 'strategic CSM', 'technical account manager', 'TAM', 'customer value', 'time to value', 'adoption', 'customer education', 'customer training'],
  },
  {
    domain: 'Customer Support & Service',
    keywords: ['customer support', 'support engineer', 'technical support', 'help desk', 'helpdesk', 'support specialist', 'customer service', 'customer care', 'support operations', 'escalation', 'escalation engineer', 'L1 support', 'L2 support', 'L3 support', 'tier 1', 'tier 2', 'tier 3', 'premier support', 'premium support', 'support manager', 'support director', 'head of support', 'support quality', 'support tools', 'knowledge base', 'help center', 'ticket', 'case management', 'SLA', 'CSAT', 'first response', 'resolution time', 'customer service representative', 'call center', 'contact center'],
  },
  {
    domain: 'Professional Services & Consulting',
    keywords: ['professional services', 'consulting', 'consultant', 'management consultant', 'strategy consultant', 'technology consultant', 'advisory', 'engagement manager', 'principal consultant', 'senior consultant', 'associate consultant', 'implementation consultant', 'solutions consultant', 'transformation', 'client partner', 'client value', 'value engineer', 'value engineering', 'delivery manager', 'delivery consultant', 'services architect', 'services engineer', 'resident consultant', 'field consultant', 'practice manager', 'services director'],
  },

  // ─── MARKETING ───

  {
    domain: 'Marketing',
    keywords: ['marketing', 'marketer', 'marketing manager', 'marketing director', 'VP marketing', 'VP of marketing', 'head of marketing', 'CMO', 'chief marketing officer', 'marketing lead', 'marketing coordinator', 'marketing specialist', 'marketing analyst', 'marketing associate', 'marketing intern', 'integrated marketing', 'marketing strategy', 'marketing operations', 'marketing ops', 'MarTech', 'marketing technology', 'marketing automation', 'Marketo', 'HubSpot', 'Pardot', 'marketing programs', 'campaign manager', 'campaign operations'],
  },
  {
    domain: 'Growth Marketing',
    keywords: ['growth', 'growth marketing', 'growth manager', 'growth lead', 'growth hacker', 'growth engineer', 'growth product manager', 'user acquisition', 'paid acquisition', 'organic growth', 'viral', 'referral', 'activation', 'retention', 'engagement', 'lifecycle marketing', 'lifecycle', 'CRM marketing', 'email marketing', 'push notification', 'in-app messaging', 'conversion', 'funnel', 'optimization', 'experimentation', 'A/B testing'],
  },
  {
    domain: 'Product Marketing',
    keywords: ['product marketing', 'product marketing manager', 'PMM', 'product marketer', 'go-to-market', 'GTM', 'launch', 'positioning', 'messaging', 'competitive intelligence', 'competitive analysis', 'market research', 'buyer persona', 'sales enablement', 'product launch', 'analyst relations', 'industry analyst', 'Gartner', 'Forrester', 'IDC', 'market intelligence', 'win/loss', 'battlecard'],
  },
  {
    domain: 'Performance Marketing & Paid Media',
    keywords: ['performance marketing', 'paid media', 'paid social', 'paid search', 'PPC', 'SEM', 'Google Ads', 'Facebook Ads', 'Meta Ads', 'LinkedIn Ads', 'display advertising', 'programmatic', 'DSP', 'RTB', 'retargeting', 'remarketing', 'CPA', 'CPC', 'CPM', 'ROAS', 'ROI', 'media buyer', 'media buying', 'media planner', 'media planning', 'ad ops', 'ad operations', 'ad tech', 'adtech', 'affiliate', 'affiliate marketing', 'influencer marketing', 'influencer', 'KOL', 'creator', 'creator partnerships'],
  },
  {
    domain: 'Content Marketing & SEO',
    keywords: ['content marketing', 'content', 'content manager', 'content lead', 'content director', 'content strategist', 'content strategy', 'content writer', 'content creator', 'copywriter', 'copywriting', 'copy', 'blog', 'editorial', 'editor', 'SEO', 'search engine optimization', 'organic search', 'keyword research', 'link building', 'technical SEO', 'on-page SEO', 'off-page SEO', 'AEO', 'GEO', 'content ops', 'content operations', 'content production', 'thought leadership', 'whitepaper', 'ebook', 'webinar'],
  },
  {
    domain: 'Social Media & Community',
    keywords: ['social media', 'social', 'social media manager', 'social media specialist', 'social media strategist', 'community', 'community manager', 'community lead', 'community operations', 'community marketing', 'community engagement', 'influencer', 'influencer marketing', 'influencer relations', 'KOL', 'creator', 'creator economy', 'user generated content', 'UGC', 'social listening', 'social analytics', 'TikTok', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube', 'Reddit', 'Discord', 'forum', 'moderator', 'moderation'],
  },
  {
    domain: 'Brand Marketing',
    keywords: ['brand', 'brand marketing', 'brand manager', 'brand strategist', 'brand strategy', 'brand director', 'brand lead', 'brand identity', 'brand awareness', 'brand equity', 'brand experience', 'brand campaign', 'brand partnerships', 'sponsorship', 'brand ambassador', 'brand voice', 'brand guidelines', 'rebranding', 'employer brand', 'talent brand'],
  },
  {
    domain: 'Field & Event Marketing',
    keywords: ['field marketing', 'event marketing', 'events', 'event manager', 'event coordinator', 'event producer', 'conference', 'summit', 'trade show', 'expo', 'webinar', 'virtual event', 'hybrid event', 'executive briefing', 'roadshow', 'meetup', 'user conference', 'field marketing manager', 'regional marketing', 'local marketing', 'ABM', 'account based marketing', 'demand generation', 'demand gen', 'lead generation', 'lead gen', 'MQL', 'SQL', 'pipeline generation'],
  },
  {
    domain: 'Communications & Public Relations',
    keywords: ['communications', 'PR', 'public relations', 'corporate communications', 'corporate comms', 'internal communications', 'internal comms', 'media relations', 'press', 'press release', 'spokesperson', 'comms manager', 'comms director', 'head of comms', 'VP communications', 'crisis communications', 'crisis management', 'reputation', 'media', 'journalist', 'analyst relations', 'AR', 'external communications', 'executive communications', 'thought leadership', 'public affairs', 'government relations', 'government affairs', 'lobbying', 'policy communications'],
  },
);


// ─── FINANCE, LEGAL & HR ───

DOMAIN_GROUPS.push(
  {
    domain: 'Finance & Accounting',
    keywords: ['finance', 'financial', 'FP&A', 'financial planning', 'financial analysis', 'financial analyst', 'senior financial analyst', 'finance manager', 'finance director', 'VP finance', 'CFO', 'chief financial officer', 'controller', 'comptroller', 'accounting', 'accountant', 'senior accountant', 'staff accountant', 'accounting manager', 'treasury', 'treasurer', 'tax', 'tax manager', 'tax analyst', 'tax compliance', 'indirect tax', 'direct tax', 'transfer pricing', 'audit', 'auditor', 'internal audit', 'external audit', 'revenue accounting', 'revenue recognition', 'billing', 'accounts payable', 'AP', 'accounts receivable', 'AR', 'general ledger', 'GL', 'consolidation', 'financial reporting', 'SEC reporting', 'GAAP', 'IFRS', 'SOX', 'bookkeeper', 'bookkeeping', 'payroll', 'payroll specialist', 'payroll manager', 'cost accounting', 'budget', 'budgeting', 'corporate finance', 'strategic finance', 'investor relations', 'IR', 'M&A', 'mergers and acquisitions', 'corporate development', 'due diligence', 'valuation'],
  },
  {
    domain: 'FinTech & Payments',
    keywords: ['fintech', 'payments', 'payment', 'payment processing', 'billing', 'checkout', 'transaction', 'merchant', 'acquiring', 'issuing', 'card', 'card network', 'Visa', 'Mastercard', 'banking', 'neobank', 'digital banking', 'lending', 'credit', 'debit', 'wallet', 'digital wallet', 'money', 'remittance', 'forex', 'FX', 'foreign exchange', 'settlement', 'clearing', 'reconciliation', 'KYC', 'know your customer', 'AML', 'anti-money laundering', 'fraud', 'fraud detection', 'fraud prevention', 'risk', 'credit risk', 'underwriting', 'stablecoin', 'BNPL', 'buy now pay later', 'open banking', 'PSD2', 'payment gateway', 'payment method', 'ACH', 'wire transfer', 'SWIFT', 'SEPA', 'UPI'],
  },
  {
    domain: 'Investment & Capital Markets',
    keywords: ['investment', 'investment banking', 'wealth management', 'asset management', 'portfolio', 'portfolio manager', 'trading', 'trader', 'capital markets', 'private equity', 'PE', 'venture capital', 'VC', 'hedge fund', 'fund manager', 'fund administration', 'equity research', 'equity analyst', 'fixed income', 'derivatives', 'options', 'futures', 'commodities', 'securities', 'broker', 'brokerage', 'custodian', 'prime brokerage', 'family office', 'endowment', 'pension', 'mutual fund', 'ETF', 'index fund', 'alternative investments', 'real assets'],
  },
  {
    domain: 'Quantitative & Trading',
    keywords: ['quantitative', 'quant', 'quantitative researcher', 'quantitative developer', 'quantitative analyst', 'quantitative trader', 'algorithmic trading', 'algo', 'HFT', 'high frequency trading', 'market making', 'systematic', 'strat', 'strategist', 'derivatives', 'options pricing', 'risk modeling', 'financial modeling', 'Monte Carlo', 'stochastic', 'time series', 'signal', 'alpha', 'backtesting', 'execution', 'low latency', 'ultra low latency'],
  },
  {
    domain: 'Human Resources & People',
    keywords: ['HR', 'human resources', 'people', 'people team', 'people operations', 'people ops', 'HR manager', 'HR director', 'VP people', 'VP HR', 'head of people', 'chief people officer', 'CPO', 'CHRO', 'chief human resources officer', 'HRBP', 'HR business partner', 'people partner', 'people business partner', 'compensation', 'compensation analyst', 'compensation manager', 'total rewards', 'benefits', 'benefits analyst', 'benefits manager', 'learning and development', 'L&D', 'training', 'employee relations', 'ER', 'employee experience', 'EX', 'workforce planning', 'organizational development', 'OD', 'change management', 'culture', 'diversity', 'equity', 'inclusion', 'DEI', 'D&I', 'belonging', 'HR technology', 'HRIS', 'Workday', 'people analytics', 'HR analytics', 'onboarding', 'offboarding', 'performance management', 'talent management', 'succession planning', 'engagement', 'employee engagement', 'HR compliance', 'labor relations', 'immigration', 'mobility', 'global mobility', 'relocation', 'expatriate'],
  },
  {
    domain: 'Recruiting & Talent Acquisition',
    keywords: ['recruiter', 'recruiting', 'recruitment', 'talent acquisition', 'TA', 'sourcer', 'sourcing', 'hiring', 'talent partner', 'recruiting coordinator', 'recruiting manager', 'recruiting director', 'head of recruiting', 'VP talent', 'technical recruiter', 'engineering recruiter', 'GTM recruiter', 'sales recruiter', 'executive recruiter', 'university recruiter', 'campus recruiter', 'early career recruiter', 'diversity recruiter', 'recruiting operations', 'recruiting ops', 'ATS', 'applicant tracking', 'employer brand', 'talent brand', 'talent marketing', 'candidate experience', 'interview', 'hiring manager', 'staffing', 'contingent workforce', 'RPO'],
  },
  {
    domain: 'Legal',
    keywords: ['legal', 'lawyer', 'attorney', 'counsel', 'general counsel', 'GC', 'corporate counsel', 'commercial counsel', 'employment counsel', 'litigation', 'litigator', 'regulatory', 'regulatory counsel', 'privacy counsel', 'product counsel', 'IP counsel', 'intellectual property', 'patent', 'patent attorney', 'trademark', 'copyright', 'contract', 'contracts manager', 'contract negotiation', 'paralegal', 'legal ops', 'legal operations', 'legal program manager', 'CLO', 'chief legal officer', 'deputy general counsel', 'associate general counsel', 'legal intern', 'law clerk', 'compliance counsel', 'data protection', 'GDPR', 'CCPA', 'legal technology', 'legal tech', 'e-discovery', 'outside counsel'],
  },
  {
    domain: 'Compliance & Risk Management',
    keywords: ['compliance', 'compliance officer', 'compliance analyst', 'compliance manager', 'compliance director', 'chief compliance officer', 'CCO', 'risk', 'risk management', 'risk analyst', 'risk manager', 'enterprise risk', 'operational risk', 'regulatory', 'regulatory compliance', 'GRC', 'governance risk compliance', 'governance', 'audit', 'internal audit', 'auditor', 'SOX', 'Sarbanes-Oxley', 'AML', 'anti-money laundering', 'KYC', 'know your customer', 'KYB', 'BSA', 'bank secrecy act', 'MLRO', 'money laundering reporting officer', 'sanctions', 'OFAC', 'financial crime', 'fraud', 'fraud analyst', 'fraud investigator', 'fraud operations', 'transaction monitoring', 'suspicious activity', 'SAR', 'CTR', 'regulatory reporting', 'license', 'licensing'],
  },
);


// ─── OPERATIONS, SUPPLY CHAIN & INDUSTRY ───

DOMAIN_GROUPS.push(
  {
    domain: 'Operations & Strategy',
    keywords: ['operations', 'ops', 'business operations', 'operations manager', 'operations analyst', 'operations director', 'VP operations', 'COO', 'chief operating officer', 'head of operations', 'process', 'process improvement', 'process optimization', 'efficiency', 'strategy', 'strategy and operations', 'strategy & operations', 'business strategy', 'corporate strategy', 'strategic planning', 'chief of staff', 'CoS', 'program manager', 'project manager', 'PMO', 'program management office', 'operational excellence', 'lean', 'six sigma', 'kaizen', 'continuous improvement', 'BPO', 'business process', 'vendor management', 'vendor operations'],
  },
  {
    domain: 'Program & Project Management',
    keywords: ['program manager', 'project manager', 'TPM', 'technical program manager', 'engineering program manager', 'program management', 'project management', 'PMO', 'scrum master', 'agile coach', 'agile', 'scrum', 'kanban', 'SAFe', 'delivery manager', 'release manager', 'program director', 'project coordinator', 'project lead', 'PMP', 'PRINCE2', 'waterfall', 'sprint', 'backlog', 'stakeholder management', 'cross-functional', 'technical program management'],
  },
  {
    domain: 'Supply Chain & Logistics',
    keywords: ['supply chain', 'supply chain manager', 'supply chain analyst', 'supply chain director', 'VP supply chain', 'logistics', 'logistics manager', 'logistics coordinator', 'procurement', 'procurement manager', 'procurement analyst', 'sourcing', 'sourcing manager', 'sourcing specialist', 'strategic sourcing', 'purchasing', 'buyer', 'vendor', 'vendor management', 'supplier', 'supplier development', 'supplier quality', 'warehouse', 'warehouse manager', 'inventory', 'inventory control', 'inventory analyst', 'fulfillment', 'distribution', 'distribution center', 'shipping', 'freight', 'transportation', 'fleet', 'supply planning', 'demand planning', 'S&OP', 'material', 'material handler', 'material flow', 'import', 'export', 'customs', 'trade compliance', 'global trade', '3PL', 'last mile'],
  },
  {
    domain: 'Manufacturing & Production',
    keywords: ['manufacturing', 'manufacturing engineer', 'production', 'production engineer', 'production manager', 'production supervisor', 'factory', 'plant', 'plant manager', 'assembly', 'assembly technician', 'quality', 'quality assurance', 'quality control', 'QC', 'quality engineer', 'quality inspector', 'quality manager', 'lean manufacturing', 'six sigma', 'process engineer', 'industrial engineer', 'industrial engineering', 'CNC', 'CNC machinist', 'CNC programmer', 'machinist', 'welder', 'welding', 'fabrication', 'fabricator', 'technician', 'operator', 'machine operator', 'maintenance', 'maintenance technician', 'maintenance engineer', 'reliability engineer', 'equipment engineer', 'tooling', 'tooling engineer', 'die', 'mold', 'injection molding', 'stamping', 'casting', 'forging', 'additive manufacturing', '3D printing', 'NDE', 'non-destructive', 'inspection', 'inspector', 'GMP', 'ISO 9001'],
  },
  {
    domain: 'Healthcare & Medicine',
    keywords: ['healthcare', 'health', 'medical', 'clinical', 'clinician', 'physician', 'doctor', 'nurse', 'nursing', 'hospital', 'patient', 'patient care', 'health system', 'EMR', 'EHR', 'electronic health record', 'HIPAA', 'health informatics', 'clinical informatics', 'medical device', 'medical affairs', 'clinical research', 'clinical trial', 'CRO', 'regulatory affairs', 'FDA', 'health AI', 'digital health', 'telehealth', 'telemedicine', 'remote patient monitoring', 'population health', 'public health', 'epidemiology', 'health economics', 'HEOR', 'payer', 'provider', 'health plan', 'health insurance', 'managed care', 'value-based care'],
  },
  {
    domain: 'Life Sciences & Biotech',
    keywords: ['life sciences', 'biotech', 'biotechnology', 'pharmaceutical', 'pharma', 'biopharma', 'drug discovery', 'drug development', 'R&D', 'research and development', 'preclinical', 'clinical development', 'clinical operations', 'regulatory', 'regulatory affairs', 'quality assurance', 'GxP', 'GMP', 'GLP', 'GCP', 'pharmacovigilance', 'medical writing', 'medical science liaison', 'MSL', 'genomics', 'proteomics', 'bioinformatics', 'computational biology', 'molecular biology', 'cell biology', 'immunology', 'oncology', 'neuroscience', 'gene therapy', 'cell therapy', 'CRISPR', 'antibody', 'vaccine', 'diagnostics', 'lab', 'laboratory', 'scientist', 'research associate', 'principal scientist', 'fellow'],
  },
  {
    domain: 'Education & EdTech',
    keywords: ['education', 'educator', 'teacher', 'professor', 'instructor', 'lecturer', 'tutor', 'training', 'trainer', 'learning', 'learning and development', 'L&D', 'instructional design', 'instructional designer', 'curriculum', 'curriculum designer', 'curriculum developer', 'course designer', 'e-learning', 'edtech', 'education technology', 'LMS', 'learning management', 'academic', 'university', 'college', 'school', 'K-12', 'higher education', 'student', 'admissions', 'enrollment', 'dean', 'provost', 'enablement', 'sales enablement', 'customer education', 'technical training', 'certification', 'accreditation'],
  },
  {
    domain: 'Aerospace & Space',
    keywords: ['aerospace', 'space', 'satellite', 'rocket', 'launch vehicle', 'propulsion', 'propulsion engineer', 'avionics', 'avionics engineer', 'GNC', 'guidance navigation control', 'guidance', 'navigation', 'control systems', 'launch', 'launch engineer', 'launch operations', 'orbit', 'orbital mechanics', 'spacecraft', 'starlink', 'starship', 'mission', 'mission manager', 'mission integration', 'flight', 'flight software', 'flight systems', 'flight safety', 'defense', 'military', 'DoD', 'department of defense', 'intelligence', 'IC', 'intelligence community', 'classified', 'top secret', 'clearance', 'security clearance', 'ITAR', 'EAR', 'space systems', 'ground systems', 'ground station', 'telemetry', 'tracking', 'command and control', 'C2', 'radar', 'lidar', 'payload'],
  },
  {
    domain: 'Civil Engineering & Construction',
    keywords: ['civil engineer', 'civil engineering', 'civil', 'construction', 'construction manager', 'construction superintendent', 'construction project manager', 'structural engineer', 'structural', 'architect', 'architecture', 'architectural', 'building', 'infrastructure', 'MEP', 'mechanical electrical plumbing', 'HVAC', 'plumbing', 'electrical', 'fire protection', 'building code', 'permit', 'zoning', 'project engineer', 'site engineer', 'superintendent', 'BIM', 'building information modeling', 'CAD', 'AutoCAD', 'Revit', 'surveyor', 'surveying', 'geotechnical', 'environmental engineer', 'water', 'wastewater', 'transportation engineer', 'traffic', 'bridge', 'highway', 'dam', 'tunnel', 'estimator', 'cost estimator', 'quantity surveyor'],
  },
  {
    domain: 'Mechanical Engineering',
    keywords: ['mechanical engineer', 'mechanical engineering', 'mechanical', 'mechanical design', 'CAD', 'CAM', 'SolidWorks', 'CATIA', 'NX', 'Creo', 'thermal', 'thermal engineer', 'thermal analysis', 'fluid', 'fluid dynamics', 'CFD', 'structural analysis', 'FEA', 'finite element', 'stress analysis', 'vibration', 'dynamics', 'design engineer', 'R&D engineer', 'materials engineer', 'materials science', 'metallurgy', 'composites', 'polymers', 'ceramics', 'reliability engineer', 'DFMEA', 'tolerance', 'GD&T', 'test engineer', 'mechanisms', 'kinematics', 'pneumatics', 'hydraulics'],
  },
  {
    domain: 'Electrical & Power Engineering',
    keywords: ['electrical engineer', 'electrical engineering', 'power systems', 'power engineer', 'power electronics', 'high voltage', 'medium voltage', 'low voltage', 'transformer', 'generator', 'motor', 'drive', 'inverter', 'converter', 'grid', 'smart grid', 'renewable energy', 'solar', 'wind', 'battery', 'energy storage', 'EV', 'electric vehicle', 'charging', 'substation', 'distribution', 'transmission', 'protection', 'relay', 'SCADA', 'PLC', 'instrumentation', 'controls', 'I&C', 'commissioning', 'electrician', 'journeyman', 'master electrician'],
  },
  {
    domain: 'Environmental & Sustainability',
    keywords: ['environmental', 'environment', 'sustainability', 'ESG', 'environmental engineer', 'EHS', 'environmental health safety', 'health and safety', 'safety engineer', 'safety manager', 'OSHA', 'EPA', 'environmental compliance', 'remediation', 'pollution', 'waste', 'recycling', 'circular economy', 'carbon', 'carbon footprint', 'net zero', 'climate', 'climate change', 'renewable', 'clean energy', 'green', 'conservation', 'ecology', 'biodiversity', 'water treatment', 'air quality', 'emissions', 'environmental impact', 'EIA', 'permitting'],
  },
);


// ─── INDUSTRY VERTICALS ───

DOMAIN_GROUPS.push(
  {
    domain: 'Banking & Financial Services',
    keywords: ['banking', 'bank', 'financial services', 'financial institution', 'investment banking', 'commercial banking', 'retail banking', 'corporate banking', 'wealth management', 'private banking', 'asset management', 'portfolio management', 'trading', 'capital markets', 'private equity', 'venture capital', 'hedge fund', 'fund', 'fund administration', 'equity research', 'credit analyst', 'loan', 'mortgage', 'treasury', 'correspondent banking', 'transaction banking', 'trade finance', 'custody', 'clearing', 'settlement', 'SWIFT', 'core banking', 'digital banking', 'open banking'],
  },
  {
    domain: 'Insurance',
    keywords: ['insurance', 'insurtech', 'underwriting', 'underwriter', 'claims', 'claims adjuster', 'claims analyst', 'actuary', 'actuarial', 'actuarial analyst', 'policy', 'policyholder', 'premium', 'risk', 'risk assessment', 'reinsurance', 'broker', 'insurance broker', 'agent', 'insurance agent', 'loss', 'loss adjuster', 'property and casualty', 'P&C', 'life insurance', 'health insurance', 'auto insurance', 'commercial insurance', 'liability', 'workers compensation', 'catastrophe', 'pricing', 'reserving'],
  },
  {
    domain: 'Real Estate & Facilities',
    keywords: ['real estate', 'property', 'property manager', 'real estate analyst', 'real estate manager', 'real estate director', 'lease', 'leasing', 'tenant', 'landlord', 'commercial real estate', 'residential', 'REIT', 'facilities', 'facilities manager', 'facilities coordinator', 'workplace', 'workplace experience', 'workplace operations', 'office manager', 'office operations', 'space planning', 'move management', 'building operations', 'property management', 'asset management', 'construction management', 'development', 'real estate development', 'site selection', 'portfolio strategy'],
  },
  {
    domain: 'Government & Public Sector',
    keywords: ['government', 'public sector', 'federal', 'federal government', 'state government', 'local government', 'SLED', 'state local education', 'defense', 'DoD', 'department of defense', 'military', 'intelligence', 'intelligence community', 'IC', 'CIA', 'NSA', 'FBI', 'DHS', 'homeland security', 'civilian', 'federal civilian', 'policy', 'public policy', 'government affairs', 'government relations', 'civic', 'civic tech', 'public service', 'public administration', 'regulation', 'regulator', 'FedRAMP', 'IL4', 'IL5', 'IL6', 'clearance', 'security clearance', 'top secret', 'TS/SCI', 'public safety', 'law enforcement', 'first responder', 'emergency management'],
  },
  {
    domain: 'Retail & E-Commerce',
    keywords: ['retail', 'e-commerce', 'ecommerce', 'online retail', 'marketplace', 'merchant', 'seller', 'buyer', 'shopping', 'cart', 'checkout', 'catalog', 'inventory', 'merchandising', 'merchandiser', 'visual merchandising', 'store', 'store manager', 'retail operations', 'omnichannel', 'DTC', 'direct to consumer', 'wholesale', 'CPG', 'consumer packaged goods', 'FMCG', 'consumer goods', 'brand', 'private label', 'supply chain', 'fulfillment', 'last mile', 'returns', 'customer experience', 'loyalty', 'pricing', 'promotions'],
  },
  {
    domain: 'Media & Entertainment',
    keywords: ['media', 'entertainment', 'content', 'streaming', 'OTT', 'video', 'audio', 'music', 'podcast', 'publishing', 'publisher', 'editor', 'editorial', 'journalist', 'reporter', 'correspondent', 'news', 'newsroom', 'broadcast', 'television', 'TV', 'film', 'movie', 'production', 'producer', 'director', 'writer', 'screenwriter', 'showrunner', 'talent', 'casting', 'programming', 'content acquisition', 'licensing', 'syndication', 'distribution', 'ad sales', 'advertising sales', 'media sales', 'ad tech', 'adtech', 'programmatic', 'sports', 'esports', 'live events'],
  },
  {
    domain: 'Telecommunications',
    keywords: ['telecom', 'telecommunications', 'telco', 'wireless', '5G', '4G', 'LTE', 'broadband', 'fiber', 'ISP', 'internet service provider', 'network operator', 'carrier', 'mobile operator', 'MVNO', 'spectrum', 'tower', 'cell site', 'RAN', 'core network', 'OSS', 'BSS', 'VoIP', 'unified communications', 'UCaaS', 'CPaaS', 'SIP', 'PBX', 'contact center', 'CCaaS'],
  },
  {
    domain: 'Automotive & Mobility',
    keywords: ['automotive', 'auto', 'vehicle', 'car', 'EV', 'electric vehicle', 'autonomous vehicle', 'self-driving', 'ADAS', 'connected car', 'V2X', 'mobility', 'ride-sharing', 'ride-hailing', 'fleet', 'fleet management', 'telematics', 'OEM', 'tier 1', 'tier 2', 'powertrain', 'drivetrain', 'chassis', 'body', 'interior', 'infotainment', 'AUTOSAR', 'CAN bus', 'automotive software', 'ISO 26262', 'functional safety'],
  },
  {
    domain: 'Energy & Utilities',
    keywords: ['energy', 'utilities', 'utility', 'power', 'electricity', 'gas', 'oil', 'oil and gas', 'petroleum', 'upstream', 'midstream', 'downstream', 'refinery', 'pipeline', 'LNG', 'renewable energy', 'solar', 'wind', 'hydro', 'geothermal', 'biomass', 'nuclear', 'energy storage', 'battery', 'grid', 'smart grid', 'microgrid', 'energy trading', 'energy management', 'demand response', 'EV charging', 'hydrogen', 'carbon capture', 'sustainability', 'clean energy', 'green energy'],
  },
  {
    domain: 'Travel & Hospitality',
    keywords: ['travel', 'hospitality', 'hotel', 'lodging', 'accommodation', 'airline', 'aviation', 'airport', 'booking', 'reservation', 'OTA', 'online travel', 'tourism', 'tour', 'cruise', 'restaurant', 'food service', 'food and beverage', 'F&B', 'chef', 'catering', 'event', 'venue', 'concierge', 'guest experience', 'front desk', 'housekeeping', 'revenue management', 'yield management', 'loyalty program', 'frequent flyer'],
  },

  // ─── CREATIVE, CONTENT & SPECIALIZED ───

  {
    domain: 'Creative & Graphic Design',
    keywords: ['creative', 'creative director', 'art director', 'creative lead', 'creative manager', 'graphic designer', 'graphic design', 'visual designer', 'visual design', 'brand designer', 'brand design', 'illustration', 'illustrator', 'typography', 'logo', 'packaging design', 'print design', 'layout', 'InDesign', 'Photoshop', 'Illustrator', 'Figma', 'Sketch', 'creative production', 'creative ops', 'creative operations', 'studio', 'studio manager', 'photo', 'photographer', 'photography', 'retoucher'],
  },
  {
    domain: 'Video & Animation',
    keywords: ['video', 'video editor', 'video producer', 'video production', 'videographer', 'cinematographer', 'director of photography', 'DP', 'post-production', 'post production', 'VFX', 'visual effects', 'CGI', 'compositing', 'color grading', 'colorist', 'after effects', 'premiere', 'DaVinci Resolve', 'final cut', 'motion graphics', 'motion designer', 'animator', 'animation', '2D animation', '3D animation', 'character animation', 'rigging', 'modeling', 'texturing', 'rendering', 'storyboard', 'sound design', 'audio engineer', 'audio', 'podcast producer', 'broadcast', 'live streaming'],
  },
  {
    domain: 'Technical Writing & Documentation',
    keywords: ['technical writer', 'technical writing', 'documentation', 'docs', 'doc writer', 'content developer', 'API documentation', 'API docs', 'knowledge base', 'help center', 'help documentation', 'information architect', 'information architecture', 'release notes', 'user guide', 'user manual', 'tutorial', 'how-to', 'developer documentation', 'developer docs', 'SDK documentation', 'style guide', 'documentation engineer', 'docs engineer'],
  },
  {
    domain: 'Developer Relations & Advocacy',
    keywords: ['developer relations', 'devrel', 'developer advocate', 'developer advocacy', 'developer experience', 'DX', 'developer evangelist', 'technical evangelist', 'developer community', 'developer marketing', 'developer education', 'developer content', 'developer programs', 'developer ecosystem', 'API evangelist', 'open source', 'OSS', 'open source program', 'OSPO', 'community manager', 'community lead', 'community engineer', 'hackathon', 'developer event'],
  },
  {
    domain: 'IT & System Administration',
    keywords: ['IT', 'information technology', 'system administrator', 'sysadmin', 'IT support', 'IT helpdesk', 'helpdesk', 'help desk', 'IT engineer', 'IT manager', 'IT director', 'VP IT', 'CIO', 'chief information officer', 'IT operations', 'IT infrastructure', 'endpoint', 'endpoint management', 'desktop support', 'desktop engineer', 'network administrator', 'network admin', 'IT security', 'IT compliance', 'IT audit', 'IT governance', 'ITIL', 'service desk', 'ITSM', 'ServiceNow', 'Jira admin', 'Confluence', 'IT procurement', 'IT asset management', 'MDM', 'mobile device management', 'AV', 'audiovisual', 'AV engineer', 'collaboration tools', 'Microsoft 365', 'Google Workspace', 'Okta', 'SSO', 'Active Directory', 'LDAP'],
  },
  {
    domain: 'Trust & Safety',
    keywords: ['trust and safety', 'trust & safety', 'T&S', 'content moderation', 'content moderator', 'abuse', 'anti-abuse', 'fraud', 'fraud analyst', 'fraud investigator', 'fraud operations', 'safety', 'user safety', 'child safety', 'CSAM', 'policy', 'policy analyst', 'policy manager', 'enforcement', 'enforcement analyst', 'integrity', 'platform integrity', 'content policy', 'community guidelines', 'appeals', 'sanctions', 'safeguards', 'harm reduction', 'disinformation', 'misinformation', 'threat intelligence', 'investigations', 'investigator', 'OSINT'],
  },
  {
    domain: 'Data Privacy & Protection',
    keywords: ['privacy', 'data privacy', 'data protection', 'DPO', 'data protection officer', 'GDPR', 'CCPA', 'CPRA', 'privacy engineer', 'privacy engineering', 'privacy program', 'privacy counsel', 'privacy analyst', 'privacy manager', 'privacy director', 'consent', 'consent management', 'cookie', 'data subject', 'DSAR', 'data mapping', 'data inventory', 'PIA', 'privacy impact assessment', 'DPIA', 'anonymization', 'pseudonymization', 'encryption', 'data governance', 'data classification', 'data retention', 'right to be forgotten', 'cross-border data'],
  },
  {
    domain: 'Localization & Internationalization',
    keywords: ['localization', 'l10n', 'internationalization', 'i18n', 'translation', 'translator', 'linguist', 'language', 'localization manager', 'localization engineer', 'localization project manager', 'localization QA', 'LQA', 'linguistic QA', 'terminology', 'glossary', 'TMS', 'translation management', 'CAT tool', 'machine translation', 'MT', 'post-editing', 'MTPE', 'cultural adaptation', 'transcreation', 'subtitling', 'dubbing', 'voice over', 'multilingual', 'globalization'],
  },

  // ─── CAREER LEVEL ───

  {
    domain: 'Internship & Early Career',
    keywords: ['intern', 'internship', 'new grad', 'new graduate', 'graduate', 'early career', 'entry level', 'entry-level', 'junior', 'apprentice', 'apprenticeship', 'co-op', 'coop', 'fellow', 'fellowship', 'trainee', 'associate', 'rotational', 'rotation program', 'graduate program', 'summer intern', 'fall intern', 'spring intern', 'winter intern', 'part-time', 'student', 'campus', 'university', 'emerging talent', 'accelerator program'],
  },
  {
    domain: 'Executive & Leadership',
    keywords: ['CEO', 'chief executive officer', 'CTO', 'chief technology officer', 'CFO', 'chief financial officer', 'COO', 'chief operating officer', 'CIO', 'chief information officer', 'CISO', 'chief information security officer', 'CMO', 'chief marketing officer', 'CRO', 'chief revenue officer', 'CPO', 'chief product officer', 'chief people officer', 'CLO', 'chief legal officer', 'VP', 'vice president', 'SVP', 'senior vice president', 'EVP', 'executive vice president', 'director', 'senior director', 'managing director', 'MD', 'head of', 'general manager', 'GM', 'president', 'founder', 'co-founder', 'partner', 'principal', 'executive', 'C-suite', 'C-level', 'board', 'board member', 'advisor', 'chairman'],
  },
  {
    domain: 'Forward Deployed & Field Engineering',
    keywords: ['forward deployed', 'forward deployed engineer', 'FDE', 'field engineer', 'field engineering', 'solutions engineer', 'implementation engineer', 'deployment engineer', 'customer engineer', 'professional services engineer', 'technical deployment', 'on-site engineer', 'resident engineer', 'embedded engineer', 'customer-facing engineer', 'applied engineer', 'applied AI engineer', 'deployment strategist', 'technical lead deployment'],
  },
  {
    domain: 'Research & Academia',
    keywords: ['research', 'researcher', 'research scientist', 'research engineer', 'research associate', 'research assistant', 'postdoc', 'postdoctoral', 'PhD', 'doctoral', 'principal researcher', 'staff researcher', 'senior researcher', 'research director', 'research manager', 'lab', 'laboratory', 'R&D', 'research and development', 'applied research', 'basic research', 'fundamental research', 'academic', 'professor', 'assistant professor', 'associate professor', 'tenure', 'faculty', 'visiting researcher', 'research fellow', 'scientist', 'principal scientist', 'distinguished scientist', 'technical fellow'],
  },
  {
    domain: 'Procurement & Vendor Management',
    keywords: ['procurement', 'procurement manager', 'procurement analyst', 'procurement director', 'VP procurement', 'chief procurement officer', 'purchasing', 'purchasing manager', 'buyer', 'senior buyer', 'category manager', 'strategic sourcing', 'sourcing manager', 'vendor management', 'vendor manager', 'supplier management', 'supplier relations', 'contract management', 'contract administrator', 'RFP', 'RFQ', 'RFI', 'bid', 'tender', 'negotiation', 'cost reduction', 'spend analysis', 'procurement operations', 'P2P', 'procure to pay', 'purchase order', 'PO'],
  },
  {
    domain: 'Customer Experience & CX',
    keywords: ['customer experience', 'CX', 'CX manager', 'CX director', 'CX strategy', 'CX operations', 'CX design', 'CX analyst', 'voice of customer', 'VOC', 'NPS', 'net promoter score', 'CSAT', 'customer satisfaction', 'CES', 'customer effort score', 'journey mapping', 'customer journey', 'touchpoint', 'omnichannel', 'customer insights', 'customer analytics', 'customer feedback', 'survey', 'customer loyalty', 'loyalty program', 'churn', 'retention', 'win-back'],
  },
  {
    domain: 'Workplace & Office Operations',
    keywords: ['workplace', 'workplace experience', 'workplace operations', 'office manager', 'office coordinator', 'office operations', 'administrative assistant', 'executive assistant', 'EA', 'admin', 'administration', 'receptionist', 'front desk', 'office administrator', 'facilities coordinator', 'workplace coordinator', 'mail room', 'catering', 'food services', 'barista', 'hospitality', 'janitorial', 'cleaning', 'security officer', 'physical security', 'badge', 'access control', 'visitor management', 'space planning', 'move coordinator'],
  },
);

// ─── EXPORTS ───

export const JOB_DOMAINS: string[] = DOMAIN_GROUPS.map(g => g.domain);

export function getExpandedKeywords(selectedDomains: string[]): string[] {
  const keywords: Set<string> = new Set();
  for (const domain of selectedDomains) {
    const group = DOMAIN_GROUPS.find(g => g.domain === domain);
    if (group) {
      for (const kw of group.keywords) {
        keywords.add(kw);
      }
    }
  }
  return Array.from(keywords);
}
