// Comprehensive role synonyms map
// Used by: Roles filter (server-side) + Desired roles filter (client-side)
// For each role, provides alternative keywords that job postings commonly use

export const ROLE_SYNONYMS: Record<string, string[]> = {
  // ===== SOFTWARE ENGINEERING =====
  'backend engineer': ['backend engineer', 'backend developer', 'back-end engineer', 'back-end developer', 'back end developer', 'server side developer', 'server-side developer', 'api developer', 'api engineer', 'node developer', 'node.js developer', 'java developer', 'python developer', 'golang developer', 'go developer', 'ruby developer', 'php developer', '.net developer', 'c# developer', 'spring developer', 'django developer', 'rails developer', 'microservices engineer', 'services engineer'],
  'frontend engineer': ['frontend engineer', 'frontend developer', 'front-end engineer', 'front-end developer', 'front end developer', 'ui developer', 'ui engineer', 'react developer', 'react engineer', 'angular developer', 'vue developer', 'vue.js developer', 'javascript developer', 'typescript developer', 'web developer', 'web engineer', 'html developer', 'css developer', 'next.js developer', 'nextjs developer'],
  'full stack engineer': ['full stack engineer', 'full stack developer', 'fullstack engineer', 'fullstack developer', 'full-stack engineer', 'full-stack developer', 'mern developer', 'mean developer', 'web application developer', 'software engineer', 'software developer', 'application developer', 'web engineer'],
  'mobile engineer (ios)': ['ios engineer', 'ios developer', 'swift developer', 'objective-c developer', 'apple developer', 'iphone developer', 'ipad developer', 'mobile engineer', 'mobile developer', 'ios mobile engineer', 'swiftui developer'],
  'mobile engineer (android)': ['android engineer', 'android developer', 'kotlin developer', 'java android developer', 'mobile engineer', 'mobile developer', 'android mobile engineer', 'jetpack compose developer'],
  'react native developer': ['react native developer', 'react native engineer', 'cross platform developer', 'cross-platform developer', 'mobile developer', 'hybrid mobile developer', 'expo developer', 'rn developer'],
  'blockchain engineer': ['blockchain engineer', 'blockchain developer', 'web3 developer', 'web3 engineer', 'smart contract developer', 'solidity developer', 'ethereum developer', 'crypto developer', 'defi developer', 'dapp developer', 'distributed ledger'],
  'cloud engineer': ['cloud engineer', 'cloud developer', 'aws engineer', 'azure engineer', 'gcp engineer', 'cloud architect', 'cloud infrastructure engineer', 'cloud solutions engineer', 'cloud platform engineer', 'cloud operations engineer', 'aws developer', 'azure developer'],
  'developer relations': ['developer relations', 'developer advocate', 'devrel', 'developer evangelist', 'technical evangelist', 'developer experience', 'dx engineer', 'community engineer', 'developer community manager', 'technical community manager'],
  'devops engineer': ['devops engineer', 'devops', 'dev ops engineer', 'build engineer', 'release engineer', 'ci/cd engineer', 'cicd engineer', 'deployment engineer', 'infrastructure engineer', 'platform engineer', 'site reliability engineer', 'sre', 'systems engineer', 'automation engineer', 'cloud ops engineer', 'kubernetes engineer', 'docker engineer'],
  'embedded engineer': ['embedded engineer', 'embedded developer', 'embedded software engineer', 'embedded systems engineer', 'firmware developer', 'iot engineer', 'iot developer', 'hardware engineer', 'embedded c developer', 'rtos developer', 'microcontroller developer'],
  'firmware engineer': ['firmware engineer', 'firmware developer', 'embedded firmware engineer', 'low level developer', 'bios engineer', 'driver developer', 'kernel developer', 'embedded software engineer'],
  'game developer': ['game developer', 'game engineer', 'game programmer', 'unity developer', 'unreal developer', 'unreal engine developer', 'game designer', 'gameplay engineer', 'graphics programmer', 'game systems engineer', 'game client engineer'],
  'graphics engineer': ['graphics engineer', 'graphics programmer', 'gpu engineer', 'rendering engineer', 'shader developer', '3d engineer', 'opengl developer', 'vulkan developer', 'directx developer', 'visual effects engineer', 'real-time rendering'],
  'platform engineer': ['platform engineer', 'platform developer', 'infrastructure engineer', 'internal tools engineer', 'developer platform engineer', 'platform architect', 'systems platform engineer', 'core platform engineer'],
  'qa / test engineer': ['qa engineer', 'test engineer', 'quality assurance engineer', 'sdet', 'software development engineer in test', 'automation engineer', 'test automation engineer', 'quality engineer', 'testing engineer', 'qa analyst', 'qa automation', 'manual tester', 'performance tester', 'load tester'],
  'robotics engineer': ['robotics engineer', 'robotics developer', 'robotics software engineer', 'robot programmer', 'automation engineer', 'mechatronics engineer', 'ros developer', 'robotics systems engineer', 'autonomous systems engineer'],
  'site reliability engineer': ['site reliability engineer', 'sre', 'reliability engineer', 'production engineer', 'infrastructure engineer', 'platform reliability engineer', 'systems reliability engineer', 'devops engineer', 'operations engineer'],
  'systems engineer': ['systems engineer', 'systems developer', 'system software engineer', 'os engineer', 'operating systems engineer', 'linux engineer', 'unix engineer', 'kernel engineer', 'low-level engineer', 'infrastructure engineer'],
  'software architect': ['software architect', 'solutions architect', 'technical architect', 'system architect', 'enterprise architect', 'application architect', 'chief architect', 'architecture lead', 'design architect'],
  'api engineer': ['api engineer', 'api developer', 'integration engineer', 'api architect', 'web services developer', 'rest api developer', 'graphql developer', 'middleware developer', 'integration developer'],
  'database engineer': ['database engineer', 'database developer', 'dba', 'database administrator', 'database architect', 'sql developer', 'data infrastructure engineer', 'database reliability engineer', 'postgres developer', 'mysql developer', 'mongodb developer'],
  'infrastructure engineer': ['infrastructure engineer', 'infra engineer', 'cloud infrastructure engineer', 'network engineer', 'systems administrator', 'sysadmin', 'it infrastructure engineer', 'datacenter engineer', 'infrastructure developer'],
  'performance engineer': ['performance engineer', 'performance tester', 'load testing engineer', 'performance analyst', 'optimization engineer', 'scalability engineer', 'capacity engineer', 'benchmarking engineer'],

  // ===== DATA & ANALYTICS =====
  'data analyst': ['data analyst', 'business analyst', 'analytics analyst', 'bi analyst', 'business intelligence analyst', 'reporting analyst', 'insights analyst', 'data analytics', 'sql analyst', 'tableau analyst', 'power bi analyst', 'analytics specialist', 'data reporting'],
  'data scientist': ['data scientist', 'data science', 'ml scientist', 'research scientist', 'applied scientist', 'quantitative researcher', 'statistical modeler', 'predictive analyst', 'data researcher', 'computational scientist'],
  'data engineer': ['data engineer', 'data pipeline engineer', 'etl developer', 'etl engineer', 'big data engineer', 'data infrastructure engineer', 'data platform engineer', 'spark developer', 'hadoop developer', 'airflow developer', 'data warehouse engineer', 'analytics engineer'],
  'business intelligence analyst': ['business intelligence analyst', 'bi analyst', 'bi developer', 'bi engineer', 'business intelligence developer', 'reporting analyst', 'dashboard developer', 'tableau developer', 'power bi developer', 'looker developer'],
  'analytics engineer': ['analytics engineer', 'analytics developer', 'data analytics engineer', 'dbt developer', 'data modeling engineer', 'analytics infrastructure engineer', 'data transformation engineer'],
  'data architect': ['data architect', 'data architecture', 'enterprise data architect', 'data modeling architect', 'data solutions architect', 'chief data architect', 'data platform architect'],
  'quantitative analyst': ['quantitative analyst', 'quant', 'quant analyst', 'quantitative researcher', 'quant developer', 'quantitative developer', 'quant trader', 'algorithmic trader', 'quantitative strategist'],
  'data operations manager': ['data operations manager', 'data ops manager', 'dataops', 'data operations lead', 'data management lead', 'data governance manager'],
  'statistical analyst': ['statistical analyst', 'statistician', 'biostatistician', 'statistical programmer', 'statistical modeler', 'stats analyst'],
  'data visualization specialist': ['data visualization specialist', 'data viz', 'visualization engineer', 'dashboard designer', 'information designer', 'visual analytics specialist'],
  'big data engineer': ['big data engineer', 'big data developer', 'hadoop engineer', 'spark engineer', 'distributed systems engineer', 'data lake engineer', 'large scale data engineer'],
  'decision scientist': ['decision scientist', 'decision analytics', 'decision support analyst', 'operations research analyst', 'optimization scientist'],
  'data governance analyst': ['data governance analyst', 'data governance specialist', 'data quality analyst', 'data steward', 'data compliance analyst', 'master data management'],
  'research scientist': ['research scientist', 'research engineer', 'applied research scientist', 'staff research scientist', 'senior researcher', 'scientific researcher', 'r&d scientist'],
  'applied scientist': ['applied scientist', 'applied research scientist', 'applied ml scientist', 'applied ai scientist', 'science engineer'],
  'predictive modeler': ['predictive modeler', 'predictive analytics', 'forecasting analyst', 'predictive modeling engineer', 'statistical modeler'],
  'business analyst': ['business analyst', 'ba', 'business systems analyst', 'requirements analyst', 'functional analyst', 'process analyst', 'business process analyst'],
  'revenue analyst': ['revenue analyst', 'revenue operations analyst', 'revops analyst', 'financial analyst', 'commercial analyst', 'pricing analyst'],
  'operations analyst': ['operations analyst', 'ops analyst', 'business operations analyst', 'operational excellence analyst', 'process improvement analyst'],
  'insights analyst': ['insights analyst', 'consumer insights analyst', 'market research analyst', 'customer insights analyst', 'user research analyst'],
  'product analyst': ['product analyst', 'product data analyst', 'product analytics', 'growth analyst', 'product metrics analyst', 'product insights analyst'],
  'marketing analyst': ['marketing analyst', 'marketing data analyst', 'digital marketing analyst', 'marketing analytics', 'campaign analyst', 'media analyst'],

  // ===== AI & MACHINE LEARNING =====
  'machine learning engineer': ['machine learning engineer', 'ml engineer', 'mle', 'ai engineer', 'applied ml engineer', 'ml developer', 'machine learning developer', 'ml infrastructure engineer', 'ml platform engineer', 'mlops engineer'],
  'ai research scientist': ['ai research scientist', 'ai researcher', 'artificial intelligence researcher', 'deep learning researcher', 'research scientist ai', 'ai scientist'],
  'deep learning engineer': ['deep learning engineer', 'deep learning developer', 'neural network engineer', 'dl engineer', 'deep learning researcher', 'tensorflow developer', 'pytorch developer'],
  'nlp engineer': ['nlp engineer', 'natural language processing engineer', 'nlp developer', 'computational linguist', 'text mining engineer', 'language model engineer', 'conversational ai engineer', 'chatbot developer'],
  'computer vision engineer': ['computer vision engineer', 'cv engineer', 'image processing engineer', 'video analytics engineer', 'perception engineer', 'visual recognition engineer', 'object detection engineer'],
  'mlops engineer': ['mlops engineer', 'ml ops engineer', 'machine learning operations', 'ml infrastructure engineer', 'ml platform engineer', 'model deployment engineer', 'ai ops engineer'],
  'ai product manager': ['ai product manager', 'ml product manager', 'ai pm', 'machine learning product manager', 'machine learning pm', 'data product manager'],
  'prompt engineer': ['prompt engineer', 'prompt engineering', 'llm engineer', 'ai prompt designer', 'generative ai engineer', 'ai content engineer'],
  'ai safety researcher': ['ai safety researcher', 'ai alignment researcher', 'responsible ai researcher', 'ai ethics researcher', 'trustworthy ai researcher', 'ai governance researcher'],
  'reinforcement learning engineer': ['reinforcement learning engineer', 'rl engineer', 'rl researcher', 'decision making engineer', 'control systems ml engineer'],
  'generative ai engineer': ['generative ai engineer', 'genai engineer', 'gen ai developer', 'llm developer', 'large language model engineer', 'foundation model engineer', 'diffusion model engineer', 'stable diffusion developer'],
  'ai ethics researcher': ['ai ethics researcher', 'responsible ai', 'ai fairness researcher', 'ai bias researcher', 'ethical ai specialist'],
  'conversational ai developer': ['conversational ai developer', 'chatbot developer', 'dialogue systems engineer', 'virtual assistant developer', 'voice ai developer', 'speech ai engineer'],
  'ai infrastructure engineer': ['ai infrastructure engineer', 'ml infrastructure engineer', 'ai platform engineer', 'gpu infrastructure engineer', 'training infrastructure engineer'],
  'robotics ml engineer': ['robotics ml engineer', 'robot learning engineer', 'autonomous systems engineer', 'robotics ai engineer', 'perception engineer'],
  'speech recognition engineer': ['speech recognition engineer', 'asr engineer', 'voice engineer', 'audio ml engineer', 'speech processing engineer', 'voice recognition developer'],
  'recommendation systems engineer': ['recommendation systems engineer', 'recommender systems engineer', 'personalization engineer', 'ranking engineer', 'search relevance engineer', 'discovery engineer'],
  'ai solutions architect': ['ai solutions architect', 'ml solutions architect', 'ai architect', 'machine learning architect', 'ai technical lead'],
  'llm engineer': ['llm engineer', 'large language model engineer', 'foundation model engineer', 'gpt engineer', 'language model developer', 'generative ai engineer', 'prompt engineer'],
  'ai trainer / annotator': ['ai trainer', 'ai annotator', 'data annotator', 'data labeler', 'annotation specialist', 'training data specialist', 'ai data curator'],
  'knowledge graph engineer': ['knowledge graph engineer', 'ontology engineer', 'semantic web engineer', 'graph database engineer', 'knowledge engineer', 'taxonomy specialist'],
  'autonomous systems engineer': ['autonomous systems engineer', 'self-driving engineer', 'autonomous vehicle engineer', 'av engineer', 'autonomy engineer', 'robotics engineer'],

  // ===== CYBERSECURITY =====
  'security engineer': ['security engineer', 'cybersecurity engineer', 'information security engineer', 'infosec engineer', 'application security engineer', 'product security engineer', 'security developer'],
  'cybersecurity analyst': ['cybersecurity analyst', 'security analyst', 'information security analyst', 'cyber analyst', 'security operations analyst', 'threat analyst'],
  'penetration tester': ['penetration tester', 'pen tester', 'ethical hacker', 'offensive security engineer', 'red team engineer', 'security researcher', 'vulnerability researcher', 'bug bounty hunter'],
  'security architect': ['security architect', 'cybersecurity architect', 'information security architect', 'enterprise security architect', 'cloud security architect', 'security solutions architect'],
  'soc analyst': ['soc analyst', 'security operations center analyst', 'security monitoring analyst', 'tier 1 analyst', 'tier 2 analyst', 'security incident analyst'],
  'threat intelligence analyst': ['threat intelligence analyst', 'threat researcher', 'cyber threat analyst', 'intelligence analyst', 'threat hunter', 'threat detection analyst'],
  'application security engineer': ['application security engineer', 'appsec engineer', 'product security engineer', 'software security engineer', 'secure code reviewer', 'application security analyst'],
  'cloud security engineer': ['cloud security engineer', 'cloud security architect', 'aws security engineer', 'azure security engineer', 'cloud infrastructure security', 'cspm engineer'],
  'identity & access management specialist': ['identity & access management specialist', 'iam specialist', 'iam engineer', 'identity engineer', 'access management engineer', 'authentication engineer', 'authorization engineer'],
  'security operations manager': ['security operations manager', 'soc manager', 'security ops manager', 'cybersecurity operations manager', 'security team lead'],
  'ciso': ['ciso', 'chief information security officer', 'vp of security', 'head of security', 'director of security', 'security executive'],
  'incident response analyst': ['incident response analyst', 'incident responder', 'ir analyst', 'security incident responder', 'dfir analyst', 'breach response analyst'],
  'vulnerability analyst': ['vulnerability analyst', 'vulnerability management analyst', 'vulnerability assessor', 'security scanner analyst', 'vuln management engineer'],
  'compliance analyst': ['compliance analyst', 'security compliance analyst', 'grc analyst', 'audit analyst', 'regulatory compliance analyst', 'it compliance analyst', 'sox analyst'],
  'forensics analyst': ['forensics analyst', 'digital forensics analyst', 'computer forensics analyst', 'cyber forensics investigator', 'forensic examiner', 'dfir analyst'],
  'red team engineer': ['red team engineer', 'red teamer', 'offensive security engineer', 'adversary simulation engineer', 'attack simulation engineer'],
  'blue team engineer': ['blue team engineer', 'defensive security engineer', 'detection engineer', 'security detection engineer', 'purple team engineer'],
  'grc analyst': ['grc analyst', 'governance risk compliance analyst', 'risk analyst', 'it risk analyst', 'security risk analyst', 'compliance specialist'],
  'security consultant': ['security consultant', 'cybersecurity consultant', 'information security consultant', 'security advisor', 'security assessor'],
  'malware analyst': ['malware analyst', 'malware researcher', 'reverse engineer', 'malware reverse engineer', 'threat researcher', 'virus analyst'],
  'cryptographer': ['cryptographer', 'cryptography engineer', 'crypto researcher', 'applied cryptographer', 'security researcher cryptography'],
  'devsecops engineer': ['devsecops engineer', 'dev sec ops engineer', 'security automation engineer', 'secure devops engineer', 'pipeline security engineer'],

  // ===== ENGINEERING (MISC) =====
  'mechanical engineer': ['mechanical engineer', 'mechanical design engineer', 'cad engineer', 'product design engineer', 'mechanical systems engineer'],
  'electrical engineer': ['electrical engineer', 'electronics engineer', 'ee', 'circuit design engineer', 'power electronics engineer', 'pcb designer', 'hardware engineer'],
  'civil engineer': ['civil engineer', 'structural engineer', 'construction engineer', 'geotechnical engineer', 'transportation engineer'],
  'chemical engineer': ['chemical engineer', 'process engineer', 'chemical process engineer', 'formulation engineer', 'materials scientist'],
  'aerospace engineer': ['aerospace engineer', 'aeronautical engineer', 'flight systems engineer', 'propulsion engineer', 'avionics engineer', 'space systems engineer'],
  'environmental engineer': ['environmental engineer', 'sustainability engineer', 'environmental consultant', 'waste management engineer', 'water resources engineer'],
  'industrial engineer': ['industrial engineer', 'manufacturing engineer', 'process improvement engineer', 'lean engineer', 'production engineer', 'operations engineer'],
  'materials engineer': ['materials engineer', 'materials scientist', 'metallurgist', 'polymer engineer', 'composites engineer', 'ceramics engineer'],
  'nuclear engineer': ['nuclear engineer', 'nuclear physicist', 'radiation engineer', 'reactor engineer', 'nuclear safety engineer'],
  'petroleum engineer': ['petroleum engineer', 'reservoir engineer', 'drilling engineer', 'production engineer', 'oil and gas engineer'],
  'structural engineer': ['structural engineer', 'structural analyst', 'structural design engineer', 'building engineer', 'bridge engineer'],
  'manufacturing engineer': ['manufacturing engineer', 'production engineer', 'process engineer', 'factory engineer', 'assembly engineer', 'cnc programmer'],
  'automation engineer': ['automation engineer', 'controls engineer', 'plc programmer', 'scada engineer', 'industrial automation engineer', 'robotics engineer'],
  'control systems engineer': ['control systems engineer', 'controls engineer', 'instrumentation engineer', 'plc engineer', 'dcs engineer', 'automation engineer'],
  'rf engineer': ['rf engineer', 'radio frequency engineer', 'wireless engineer', 'antenna engineer', 'microwave engineer', 'communications engineer'],
  'optical engineer': ['optical engineer', 'photonics engineer', 'laser engineer', 'optics designer', 'imaging engineer'],
  'audio engineer': ['audio engineer', 'sound engineer', 'acoustic engineer', 'dsp engineer', 'audio software engineer', 'signal processing engineer'],
  'test engineer': ['test engineer', 'validation engineer', 'verification engineer', 'test development engineer', 'hardware test engineer', 'system test engineer'],
  'reliability engineer': ['reliability engineer', 'reliability analyst', 'failure analysis engineer', 'durability engineer', 'quality reliability engineer'],
  'validation engineer': ['validation engineer', 'verification engineer', 'v&v engineer', 'test validation engineer', 'system validation engineer'],
  'process engineer': ['process engineer', 'manufacturing process engineer', 'chemical process engineer', 'production process engineer', 'continuous improvement engineer'],
  'packaging engineer': ['packaging engineer', 'package design engineer', 'packaging specialist', 'packaging developer', 'pack engineer'],

  // ===== PRODUCT =====
  'product manager': ['product manager', 'pm', 'product lead', 'product owner', 'product head', 'product management'],
  'senior product manager': ['senior product manager', 'sr product manager', 'senior pm', 'lead product manager', 'staff product manager'],
  'technical product manager': ['technical product manager', 'technical pm', 'tpm', 'platform product manager', 'api product manager', 'infrastructure product manager'],
  'product owner': ['product owner', 'po', 'scrum product owner', 'agile product owner', 'backlog owner'],
  'vp of product': ['vp of product', 'vice president of product', 'svp product', 'head of product', 'product vp'],
  'chief product officer': ['chief product officer', 'cpo', 'head of product', 'evp product'],
  'product operations manager': ['product operations manager', 'product ops manager', 'product operations lead', 'prodops manager'],
  'growth product manager': ['growth product manager', 'growth pm', 'growth manager', 'growth lead', 'user acquisition pm', 'retention pm'],
  'platform product manager': ['platform product manager', 'platform pm', 'infrastructure pm', 'developer platform pm', 'internal tools pm'],
  'product marketing manager': ['product marketing manager', 'pmm', 'product marketer', 'go-to-market manager', 'gtm manager', 'launch manager'],
  'product designer': ['product designer', 'ux designer', 'ui/ux designer', 'ux/ui designer', 'digital product designer', 'experience designer', 'interaction designer'],
  'product strategy lead': ['product strategy lead', 'product strategist', 'strategy lead', 'product strategy manager', 'strategic product manager'],
  'associate product manager': ['associate product manager', 'apm', 'junior product manager', 'product manager associate', 'rotational pm'],
  'staff product manager': ['staff product manager', 'staff pm', 'principal product manager', 'senior staff pm'],
  'principal product manager': ['principal product manager', 'principal pm', 'distinguished pm', 'senior principal pm'],
  'product data analyst': ['product data analyst', 'product analytics analyst', 'product metrics analyst', 'product insights analyst'],
  'product researcher': ['product researcher', 'user researcher', 'ux researcher', 'product research lead', 'design researcher'],
  'product enablement manager': ['product enablement manager', 'product training manager', 'product education manager', 'enablement lead'],
  'product partnerships manager': ['product partnerships manager', 'partner product manager', 'ecosystem pm', 'integrations pm', 'partnerships lead'],
  'b2b product manager': ['b2b product manager', 'enterprise product manager', 'b2b pm', 'saas product manager', 'platform pm'],

  // ===== CONSULTING =====
  'management consultant': ['management consultant', 'strategy consultant', 'business consultant', 'consulting analyst', 'associate consultant', 'senior consultant', 'consultant'],
  'strategy consultant': ['strategy consultant', 'strategy analyst', 'corporate strategy', 'business strategy', 'strategic advisor', 'strategy associate'],
  'technology consultant': ['technology consultant', 'it consultant', 'tech consultant', 'digital consultant', 'technology advisor', 'solutions consultant'],
  'operations consultant': ['operations consultant', 'ops consultant', 'process consultant', 'supply chain consultant', 'operational excellence consultant'],
  'financial advisory consultant': ['financial advisory consultant', 'financial consultant', 'finance consultant', 'transaction advisory', 'valuation consultant', 'due diligence consultant'],
  'hr consultant': ['hr consultant', 'people consultant', 'organizational consultant', 'talent consultant', 'workforce consultant', 'human capital consultant'],
  'it consultant': ['it consultant', 'information technology consultant', 'systems consultant', 'infrastructure consultant', 'erp consultant', 'sap consultant'],
  'risk consultant': ['risk consultant', 'risk advisory', 'risk management consultant', 'enterprise risk consultant', 'financial risk consultant'],
  'supply chain consultant': ['supply chain consultant', 'logistics consultant', 'procurement consultant', 'sourcing consultant', 'supply chain advisor'],
  'digital transformation consultant': ['digital transformation consultant', 'digital consultant', 'transformation consultant', 'innovation consultant', 'digitalization consultant'],
  'change management consultant': ['change management consultant', 'change consultant', 'organizational change consultant', 'transformation lead', 'change advisor'],
  'healthcare consultant': ['healthcare consultant', 'health consultant', 'pharma consultant', 'life sciences consultant', 'medical consultant'],
  'sustainability consultant': ['sustainability consultant', 'esg consultant', 'environmental consultant', 'climate consultant', 'green consultant'],
  'data consultant': ['data consultant', 'data strategy consultant', 'analytics consultant', 'data advisory', 'data management consultant'],
  'm&a advisory': ['m&a advisory', 'mergers and acquisitions', 'm&a analyst', 'deal advisory', 'corporate finance advisor', 'investment banking'],
  'pricing consultant': ['pricing consultant', 'pricing analyst', 'pricing strategist', 'revenue management consultant', 'commercial consultant'],
  'implementation consultant': ['implementation consultant', 'implementation specialist', 'deployment consultant', 'solutions implementation', 'technical consultant'],
  'process improvement consultant': ['process improvement consultant', 'lean consultant', 'six sigma consultant', 'continuous improvement consultant', 'bpm consultant'],
  'internal consultant': ['internal consultant', 'internal strategy', 'corporate strategy analyst', 'internal advisory', 'business excellence'],
  'due diligence analyst': ['due diligence analyst', 'dd analyst', 'transaction analyst', 'deal analyst', 'investment analyst'],
  'engagement manager': ['engagement manager', 'client engagement manager', 'delivery manager', 'project leader', 'consulting manager'],

  // ===== DESIGN =====
  'ux designer': ['ux designer', 'user experience designer', 'ux/ui designer', 'experience designer', 'interaction designer', 'usability designer', 'ux specialist'],
  'ui designer': ['ui designer', 'user interface designer', 'visual designer', 'ui/ux designer', 'interface designer', 'screen designer', 'gui designer'],
  'graphic designer': ['graphic designer', 'visual designer', 'creative designer', 'print designer', 'layout designer', 'communication designer'],
  'brand designer': ['brand designer', 'brand identity designer', 'branding specialist', 'brand strategist', 'brand creative', 'identity designer'],
  'motion designer': ['motion designer', 'motion graphics designer', 'animator', 'animation designer', 'video designer', 'after effects designer', 'motion artist'],
  'interaction designer': ['interaction designer', 'ixd designer', 'interactive designer', 'ux interaction designer', 'behavioral designer'],
  'visual designer': ['visual designer', 'graphic designer', 'ui visual designer', 'creative designer', 'digital designer'],
  'design systems designer': ['design systems designer', 'design systems engineer', 'component designer', 'design tokens specialist', 'design system lead'],
  'ux researcher': ['ux researcher', 'user researcher', 'design researcher', 'usability researcher', 'user research analyst', 'qualitative researcher', 'research designer'],
  'content designer': ['content designer', 'ux writer', 'ux copywriter', 'content strategist', 'content ux designer', 'microcopy writer'],
  'service designer': ['service designer', 'experience designer', 'service design strategist', 'customer experience designer', 'cx designer'],
  'design lead': ['design lead', 'design manager', 'head of design', 'design director', 'ux lead', 'ui lead', 'senior designer'],
  'creative director': ['creative director', 'cd', 'executive creative director', 'chief creative officer', 'head of creative', 'art director'],
  'illustrator': ['illustrator', 'digital illustrator', 'artist', 'concept artist', 'visual artist', 'character designer', 'icon designer'],
  'web designer': ['web designer', 'website designer', 'webflow designer', 'digital designer', 'web ui designer', 'landing page designer'],
  '3d designer': ['3d designer', '3d artist', '3d modeler', 'cgi artist', '3d animator', 'blender artist', 'maya artist', '3d visualization'],
  'design ops manager': ['design ops manager', 'designops', 'design operations manager', 'design program manager', 'design coordinator'],
  'accessibility designer': ['accessibility designer', 'a11y designer', 'inclusive designer', 'accessibility specialist', 'accessible ux designer'],
  'design strategist': ['design strategist', 'strategic designer', 'design thinking facilitator', 'innovation designer', 'design consultant'],
  'industrial designer': ['industrial designer', 'product designer', 'id designer', 'physical product designer', 'consumer product designer', 'hardware designer'],
  'packaging designer': ['packaging designer', 'package designer', 'structural designer', 'packaging artist', 'label designer'],
};


// ===== FINANCE =====
export const FINANCE_SYNONYMS: Record<string, string[]> = {
  'financial analyst': ['financial analyst', 'finance analyst', 'corporate finance analyst', 'financial planning analyst', 'fp&a analyst', 'financial modeler', 'finance associate'],
  'investment banking analyst': ['investment banking analyst', 'ib analyst', 'investment banker', 'banking analyst', 'deal analyst', 'corporate finance analyst', 'ibd analyst', 'bulge bracket analyst'],
  'accountant': ['accountant', 'staff accountant', 'senior accountant', 'cpa', 'chartered accountant', 'general ledger accountant', 'financial accountant', 'management accountant', 'cost accountant'],
  'auditor': ['auditor', 'internal auditor', 'external auditor', 'it auditor', 'financial auditor', 'compliance auditor', 'audit associate', 'audit manager', 'sox auditor'],
  'fp&a analyst': ['fp&a analyst', 'financial planning and analysis', 'fpa analyst', 'planning analyst', 'budgeting analyst', 'forecasting analyst', 'financial planning analyst'],
  'treasury analyst': ['treasury analyst', 'treasury manager', 'cash management analyst', 'liquidity analyst', 'treasury operations', 'corporate treasury'],
  'tax analyst': ['tax analyst', 'tax accountant', 'tax specialist', 'tax associate', 'tax consultant', 'tax preparer', 'indirect tax analyst', 'transfer pricing analyst'],
  'credit analyst': ['credit analyst', 'credit risk analyst', 'underwriter', 'credit underwriter', 'lending analyst', 'loan analyst', 'credit officer'],
  'portfolio manager': ['portfolio manager', 'fund manager', 'asset manager', 'investment manager', 'wealth manager', 'portfolio analyst', 'investment portfolio manager'],
  'risk analyst': ['risk analyst', 'risk manager', 'market risk analyst', 'credit risk analyst', 'operational risk analyst', 'enterprise risk analyst', 'financial risk analyst', 'risk modeler'],
  'equity research analyst': ['equity research analyst', 'research analyst', 'stock analyst', 'sell-side analyst', 'buy-side analyst', 'investment research analyst', 'securities analyst'],
  'venture capital analyst': ['venture capital analyst', 'vc analyst', 'vc associate', 'venture analyst', 'startup analyst', 'investment analyst vc', 'venture capital associate'],
  'private equity associate': ['private equity associate', 'pe associate', 'private equity analyst', 'buyout analyst', 'lbo analyst', 'pe analyst', 'growth equity associate'],
  'cfo': ['cfo', 'chief financial officer', 'finance director', 'vp finance', 'head of finance', 'svp finance', 'finance executive'],
  'controller': ['controller', 'financial controller', 'corporate controller', 'assistant controller', 'division controller', 'plant controller', 'accounting manager'],
  'revenue analyst': ['revenue analyst', 'revenue operations analyst', 'revops analyst', 'revenue accountant', 'revenue recognition analyst', 'commercial analyst'],
  'billing specialist': ['billing specialist', 'billing analyst', 'billing coordinator', 'invoicing specialist', 'accounts receivable specialist', 'billing operations'],
  'payroll manager': ['payroll manager', 'payroll specialist', 'payroll administrator', 'payroll analyst', 'compensation specialist', 'payroll coordinator'],
  'financial planner': ['financial planner', 'financial advisor', 'wealth advisor', 'cfp', 'financial consultant', 'retirement planner', 'investment advisor'],
  'actuary': ['actuary', 'actuarial analyst', 'actuarial scientist', 'pricing actuary', 'reserving actuary', 'pension actuary', 'insurance actuary'],
  'quantitative trader': ['quantitative trader', 'quant trader', 'algorithmic trader', 'systematic trader', 'prop trader', 'proprietary trader', 'trading analyst'],
  'fund accountant': ['fund accountant', 'fund accounting analyst', 'nav analyst', 'investment accountant', 'hedge fund accountant', 'mutual fund accountant'],

  // ===== MARKETING =====
  'marketing manager': ['marketing manager', 'marketing lead', 'marketing head', 'marketing director', 'marketing specialist', 'marketing coordinator'],
  'digital marketing manager': ['digital marketing manager', 'digital marketer', 'online marketing manager', 'digital marketing specialist', 'digital marketing lead', 'internet marketing manager'],
  'content marketing manager': ['content marketing manager', 'content manager', 'content lead', 'content marketing specialist', 'editorial manager', 'content director'],
  'growth marketing manager': ['growth marketing manager', 'growth marketer', 'growth manager', 'growth lead', 'growth hacker', 'user acquisition manager', 'lifecycle marketing manager'],
  'performance marketing manager': ['performance marketing manager', 'performance marketer', 'paid marketing manager', 'paid media manager', 'acquisition marketing manager', 'paid ads manager'],
  'seo specialist': ['seo specialist', 'seo manager', 'seo analyst', 'search engine optimization', 'organic search specialist', 'seo strategist', 'seo consultant', 'technical seo'],
  'social media manager': ['social media manager', 'social media specialist', 'social media coordinator', 'community manager', 'social media strategist', 'social media lead'],
  'brand manager': ['brand manager', 'brand strategist', 'brand marketing manager', 'brand lead', 'brand director', 'brand specialist'],
  'email marketing specialist': ['email marketing specialist', 'email marketer', 'email marketing manager', 'crm specialist', 'lifecycle marketer', 'marketing automation specialist', 'hubspot specialist', 'marketo specialist'],
  'marketing analyst': ['marketing analyst', 'marketing data analyst', 'digital marketing analyst', 'marketing analytics', 'campaign analyst', 'media analyst', 'marketing insights analyst'],
  'demand generation manager': ['demand generation manager', 'demand gen manager', 'lead generation manager', 'pipeline marketing manager', 'demand gen lead', 'inbound marketing manager'],
  'content strategist': ['content strategist', 'content strategy lead', 'editorial strategist', 'content planner', 'content architect', 'information architect'],
  'copywriter': ['copywriter', 'copy writer', 'content writer', 'creative writer', 'marketing writer', 'advertising copywriter', 'brand copywriter', 'ux writer', 'technical writer'],
  'marketing operations manager': ['marketing operations manager', 'marketing ops manager', 'mops manager', 'marketing technology manager', 'martech manager'],
  'influencer marketing manager': ['influencer marketing manager', 'influencer manager', 'creator partnerships manager', 'influencer relations', 'creator marketing manager'],
  'affiliate marketing manager': ['affiliate marketing manager', 'affiliate manager', 'partnerships marketing manager', 'partner marketing manager', 'affiliate program manager'],
  'product marketing manager': ['product marketing manager', 'pmm', 'product marketer', 'go-to-market manager', 'gtm manager', 'launch manager', 'solutions marketing manager'],
  'cmo': ['cmo', 'chief marketing officer', 'head of marketing', 'vp marketing', 'svp marketing', 'marketing executive', 'evp marketing'],
  'community manager': ['community manager', 'community lead', 'community specialist', 'online community manager', 'community engagement manager', 'forum manager'],
  'pr manager': ['pr manager', 'public relations manager', 'communications manager', 'media relations manager', 'press manager', 'corporate communications manager', 'comms manager'],
  'event marketing manager': ['event marketing manager', 'events manager', 'event coordinator', 'conference manager', 'field marketing manager', 'experiential marketing manager'],
  'paid media specialist': ['paid media specialist', 'paid media manager', 'ppc specialist', 'sem specialist', 'google ads specialist', 'facebook ads specialist', 'paid search specialist', 'media buyer'],

  // ===== SALES =====
  'sales representative': ['sales representative', 'sales rep', 'sales associate', 'sales agent', 'sales professional', 'sales executive'],
  'account executive': ['account executive', 'ae', 'sales executive', 'enterprise ae', 'mid-market ae', 'smb ae', 'closing rep', 'quota carrier'],
  'sales manager': ['sales manager', 'sales lead', 'sales team lead', 'sales supervisor', 'area sales manager', 'district sales manager'],
  'business development representative': ['business development representative', 'bdr', 'sdr', 'sales development representative', 'outbound rep', 'prospecting rep', 'lead development rep', 'market development rep'],
  'sales director': ['sales director', 'director of sales', 'head of sales', 'sales head', 'commercial director'],
  'vp of sales': ['vp of sales', 'vice president of sales', 'svp sales', 'head of sales', 'chief sales officer', 'sales vp'],
  'inside sales representative': ['inside sales representative', 'inside sales rep', 'inside sales', 'inbound sales rep', 'phone sales rep', 'virtual sales rep'],
  'outside sales representative': ['outside sales representative', 'outside sales rep', 'field sales rep', 'field sales representative', 'territory rep', 'door to door sales'],
  'sales engineer': ['sales engineer', 'se', 'pre-sales engineer', 'solutions engineer', 'technical sales engineer', 'sales consultant', 'demo engineer'],
  'solutions consultant': ['solutions consultant', 'solutions architect', 'pre-sales consultant', 'technical consultant', 'solutions specialist', 'client solutions'],
  'enterprise account executive': ['enterprise account executive', 'enterprise ae', 'enterprise sales', 'strategic account executive', 'named account executive', 'large enterprise rep'],
  'account manager': ['account manager', 'am', 'client manager', 'relationship manager', 'customer account manager', 'strategic account manager', 'key account manager'],
  'sales operations manager': ['sales operations manager', 'sales ops manager', 'revenue operations manager', 'sales operations lead', 'sales analytics manager'],
  'revenue operations manager': ['revenue operations manager', 'revops manager', 'revenue ops', 'go-to-market operations', 'gtm ops manager', 'business operations manager'],
  'channel sales manager': ['channel sales manager', 'partner sales manager', 'channel manager', 'partner manager', 'alliance manager', 'indirect sales manager'],
  'regional sales manager': ['regional sales manager', 'rsm', 'area manager', 'territory manager', 'zone manager', 'regional manager'],
  'sales enablement manager': ['sales enablement manager', 'enablement manager', 'sales readiness manager', 'sales training manager', 'revenue enablement manager'],
  'pre-sales consultant': ['pre-sales consultant', 'presales consultant', 'pre-sales engineer', 'solutions consultant', 'technical pre-sales', 'demo specialist'],
  'key account manager': ['key account manager', 'kam', 'strategic account manager', 'major account manager', 'global account manager', 'named account manager'],
  'territory manager': ['territory manager', 'territory sales manager', 'area manager', 'district manager', 'zone manager', 'field manager'],
  'chief revenue officer': ['chief revenue officer', 'cro', 'head of revenue', 'vp revenue', 'revenue leader'],
  'sales trainer': ['sales trainer', 'sales coach', 'sales training specialist', 'sales development trainer', 'sales enablement specialist'],

  // ===== HUMAN RESOURCES =====
  'hr generalist': ['hr generalist', 'human resources generalist', 'hr specialist', 'people generalist', 'hr coordinator', 'hr associate', 'people partner'],
  'recruiter': ['recruiter', 'talent acquisition specialist', 'sourcer', 'recruiting coordinator', 'staffing specialist', 'hiring specialist', 'recruitment consultant'],
  'technical recruiter': ['technical recruiter', 'tech recruiter', 'engineering recruiter', 'it recruiter', 'software recruiter', 'technology recruiter'],
  'talent acquisition manager': ['talent acquisition manager', 'ta manager', 'recruiting manager', 'head of recruiting', 'hiring manager', 'talent manager', 'recruitment manager'],
  'hr business partner': ['hr business partner', 'hrbp', 'people business partner', 'strategic hr partner', 'hr partner', 'people partner'],
  'people operations manager': ['people operations manager', 'people ops manager', 'hr operations manager', 'people team lead', 'employee experience manager'],
  'compensation & benefits analyst': ['compensation & benefits analyst', 'comp & ben analyst', 'total rewards analyst', 'compensation analyst', 'benefits analyst', 'rewards specialist'],
  'learning & development specialist': ['learning & development specialist', 'l&d specialist', 'training specialist', 'learning designer', 'instructional designer', 'corporate trainer', 'training manager'],
  'employee relations manager': ['employee relations manager', 'er manager', 'employee relations specialist', 'labor relations manager', 'workplace relations manager'],
  'diversity & inclusion manager': ['diversity & inclusion manager', 'dei manager', 'd&i manager', 'diversity manager', 'inclusion specialist', 'belonging manager', 'equity manager'],
  'hr analyst': ['hr analyst', 'people analyst', 'workforce analyst', 'hr data analyst', 'people analytics analyst', 'hr reporting analyst'],
  'onboarding specialist': ['onboarding specialist', 'onboarding coordinator', 'new hire specialist', 'employee onboarding manager', 'orientation specialist'],
  'employer branding manager': ['employer branding manager', 'employer brand specialist', 'talent brand manager', 'recruitment marketing manager', 'evp manager'],
  'workforce planning analyst': ['workforce planning analyst', 'workforce planner', 'headcount planning analyst', 'strategic workforce planner', 'capacity planner'],
  'hris analyst': ['hris analyst', 'hris specialist', 'hr systems analyst', 'workday analyst', 'successfactors analyst', 'hr technology analyst', 'people systems analyst'],
  'chief people officer': ['chief people officer', 'cpo', 'chro', 'chief human resources officer', 'head of people', 'vp people', 'svp people'],
  'hr director': ['hr director', 'human resources director', 'people director', 'director of hr', 'head of hr', 'hr head'],
  'organizational development specialist': ['organizational development specialist', 'od specialist', 'org development consultant', 'organizational effectiveness specialist', 'change specialist'],
  'talent management specialist': ['talent management specialist', 'talent development specialist', 'succession planning specialist', 'career development specialist', 'talent programs manager'],
  'payroll specialist': ['payroll specialist', 'payroll administrator', 'payroll coordinator', 'payroll analyst', 'payroll processor', 'compensation administrator'],
  'hr coordinator': ['hr coordinator', 'human resources coordinator', 'people coordinator', 'hr assistant', 'hr administrator', 'people operations coordinator'],
  'executive recruiter': ['executive recruiter', 'executive search', 'headhunter', 'senior recruiter', 'leadership recruiter', 'c-suite recruiter', 'retained search'],

  // ===== OPERATIONS & STRATEGY =====
  'operations manager': ['operations manager', 'ops manager', 'business operations manager', 'general manager', 'operations lead', 'operations director'],
  'strategy analyst': ['strategy analyst', 'corporate strategy analyst', 'business strategy analyst', 'strategic planning analyst', 'strategy associate', 'strategy consultant'],
  'business operations manager': ['business operations manager', 'bizops manager', 'business ops', 'operations lead', 'business manager', 'general operations manager'],
  'program manager': ['program manager', 'pgm', 'technical program manager', 'tpm', 'program lead', 'program director', 'program coordinator'],
  'project manager': ['project manager', 'pm', 'it project manager', 'technical project manager', 'digital project manager', 'project lead', 'project coordinator', 'pmp'],
  'chief of staff': ['chief of staff', 'cos', 'executive chief of staff', 'office of the ceo', 'strategic advisor', 'executive assistant to ceo'],
  'supply chain manager': ['supply chain manager', 'supply chain lead', 'scm manager', 'supply chain director', 'global supply chain manager', 'supply planning manager'],
  'logistics coordinator': ['logistics coordinator', 'logistics manager', 'shipping coordinator', 'distribution coordinator', 'transportation coordinator', 'freight coordinator'],
  'lean six sigma specialist': ['lean six sigma specialist', 'lean specialist', 'six sigma black belt', 'continuous improvement specialist', 'process excellence specialist', 'kaizen specialist'],
  'vendor manager': ['vendor manager', 'vendor management specialist', 'supplier manager', 'third party manager', 'vendor relations manager', 'partner manager'],
  'procurement specialist': ['procurement specialist', 'procurement manager', 'buyer', 'purchasing specialist', 'sourcing specialist', 'procurement analyst', 'strategic sourcing'],
  'facilities manager': ['facilities manager', 'facility manager', 'building manager', 'workplace manager', 'office manager', 'site manager'],
  'coo': ['coo', 'chief operating officer', 'head of operations', 'vp operations', 'svp operations', 'operations executive'],
  'strategy & operations lead': ['strategy & operations lead', 'stratops lead', 'strategy and operations', 'bizops lead', 'strategic operations manager'],
  'business process analyst': ['business process analyst', 'process analyst', 'bpa', 'business process engineer', 'workflow analyst', 'process mapping analyst'],
  'capacity planner': ['capacity planner', 'capacity planning analyst', 'resource planner', 'demand planner', 'workforce planner', 'capacity manager'],
  'quality assurance manager': ['quality assurance manager', 'qa manager', 'quality manager', 'quality control manager', 'quality director', 'quality lead'],
  'inventory manager': ['inventory manager', 'inventory analyst', 'inventory planner', 'stock manager', 'warehouse manager', 'inventory control manager'],
  'fleet manager': ['fleet manager', 'fleet coordinator', 'transportation manager', 'vehicle manager', 'fleet operations manager'],
  'scrum master': ['scrum master', 'agile scrum master', 'certified scrum master', 'csm', 'iteration manager', 'agile facilitator'],
  'agile coach': ['agile coach', 'agile consultant', 'agile transformation coach', 'enterprise agile coach', 'lean agile coach', 'agile mentor'],

  // ===== HEALTHCARE =====
  'clinical data manager': ['clinical data manager', 'clinical data specialist', 'cdm', 'clinical database manager', 'clinical data lead', 'data management lead'],
  'health informatics specialist': ['health informatics specialist', 'health it specialist', 'clinical informatics specialist', 'healthcare informatics analyst', 'biomedical informatics'],
  'biomedical engineer': ['biomedical engineer', 'bme', 'bioengineering', 'medical device engineer', 'clinical engineer', 'biotech engineer'],
  'clinical research associate': ['clinical research associate', 'cra', 'clinical monitor', 'clinical trial monitor', 'site monitor', 'field monitor'],
  'healthcare consultant': ['healthcare consultant', 'health consultant', 'hospital consultant', 'clinical consultant', 'health systems consultant'],
  'medical science liaison': ['medical science liaison', 'msl', 'medical affairs', 'scientific liaison', 'medical advisor', 'field medical advisor'],
  'pharmaceutical sales rep': ['pharmaceutical sales rep', 'pharma rep', 'medical rep', 'drug rep', 'pharmaceutical sales representative', 'specialty sales rep'],
  'regulatory affairs specialist': ['regulatory affairs specialist', 'regulatory specialist', 'regulatory affairs manager', 'ra specialist', 'regulatory compliance specialist', 'fda specialist'],
  'health it analyst': ['health it analyst', 'healthcare it analyst', 'health systems analyst', 'ehr analyst', 'epic analyst', 'cerner analyst', 'clinical systems analyst'],
  'telemedicine coordinator': ['telemedicine coordinator', 'telehealth coordinator', 'virtual care coordinator', 'remote health coordinator', 'digital health coordinator'],
  'clinical operations manager': ['clinical operations manager', 'clinical ops manager', 'clinical trial manager', 'clinical project manager', 'clinical study manager'],
  'medical writer': ['medical writer', 'scientific writer', 'regulatory writer', 'clinical writer', 'medical communications', 'medcomms writer'],
  'pharmacovigilance specialist': ['pharmacovigilance specialist', 'pv specialist', 'drug safety specialist', 'drug safety associate', 'adverse event specialist', 'safety scientist'],
  'healthcare data analyst': ['healthcare data analyst', 'health data analyst', 'clinical data analyst', 'health analytics', 'population health analyst', 'outcomes analyst'],
  'nursing informatics specialist': ['nursing informatics specialist', 'nurse informaticist', 'clinical informatics nurse', 'nursing systems analyst'],
  'public health analyst': ['public health analyst', 'epidemiologist', 'public health specialist', 'population health analyst', 'health policy analyst', 'global health analyst'],
  'epidemiologist': ['epidemiologist', 'epi analyst', 'disease surveillance specialist', 'infectious disease epidemiologist', 'chronic disease epidemiologist'],
  'health policy analyst': ['health policy analyst', 'healthcare policy analyst', 'health policy researcher', 'policy advisor health', 'health economics analyst'],
  'lab technician': ['lab technician', 'laboratory technician', 'medical lab technician', 'clinical lab technician', 'research technician', 'lab analyst'],
  'biostatistician': ['biostatistician', 'biostatistics analyst', 'clinical statistician', 'statistical programmer', 'biometrics analyst', 'stats programmer'],
  'clinical trial manager': ['clinical trial manager', 'ctm', 'clinical study manager', 'trial manager', 'clinical project manager', 'study director'],
  'medical device engineer': ['medical device engineer', 'medical device developer', 'device engineer', 'medical equipment engineer', 'biomedical device engineer'],

  // ===== LEGAL =====
  'corporate lawyer': ['corporate lawyer', 'corporate attorney', 'corporate counsel', 'business lawyer', 'transactional lawyer', 'commercial lawyer', 'corporate associate'],
  'compliance officer': ['compliance officer', 'compliance manager', 'compliance specialist', 'regulatory compliance officer', 'chief compliance officer', 'compliance director'],
  'legal counsel': ['legal counsel', 'in-house counsel', 'associate counsel', 'senior counsel', 'staff attorney', 'legal advisor', 'attorney'],
  'paralegal': ['paralegal', 'legal assistant', 'litigation paralegal', 'corporate paralegal', 'legal coordinator', 'legal secretary'],
  'contract manager': ['contract manager', 'contracts manager', 'contract specialist', 'contract administrator', 'contract analyst', 'commercial contracts manager'],
  'ip attorney': ['ip attorney', 'intellectual property attorney', 'patent attorney', 'trademark attorney', 'ip counsel', 'ip lawyer', 'patent lawyer'],
  'privacy counsel': ['privacy counsel', 'privacy attorney', 'data privacy lawyer', 'privacy officer', 'dpo', 'data protection officer', 'gdpr specialist', 'privacy specialist'],
  'litigation associate': ['litigation associate', 'litigation attorney', 'trial attorney', 'litigator', 'dispute resolution attorney', 'civil litigation lawyer'],
  'legal operations manager': ['legal operations manager', 'legal ops manager', 'legal project manager', 'legal operations lead', 'legal technology manager'],
  'regulatory counsel': ['regulatory counsel', 'regulatory attorney', 'regulatory lawyer', 'regulatory affairs counsel', 'government affairs counsel'],
  'employment lawyer': ['employment lawyer', 'employment attorney', 'labor lawyer', 'labor attorney', 'workplace lawyer', 'employment law counsel'],
  'tax attorney': ['tax attorney', 'tax lawyer', 'tax counsel', 'tax advisor', 'international tax attorney', 'state tax attorney'],
  'm&a lawyer': ['m&a lawyer', 'mergers and acquisitions lawyer', 'm&a attorney', 'm&a counsel', 'deal lawyer', 'transactional attorney'],
  'legal analyst': ['legal analyst', 'legal research analyst', 'legal data analyst', 'litigation analyst', 'legal intelligence analyst'],
  'general counsel': ['general counsel', 'gc', 'chief legal officer', 'clo', 'head of legal', 'vp legal', 'legal director'],
  'patent agent': ['patent agent', 'patent specialist', 'patent analyst', 'patent examiner', 'patent prosecution', 'ip specialist'],
  'legal tech specialist': ['legal tech specialist', 'legal technology specialist', 'legal innovation specialist', 'legal automation specialist', 'legaltech'],
  'risk & compliance analyst': ['risk & compliance analyst', 'risk compliance analyst', 'grc analyst', 'regulatory risk analyst', 'compliance risk analyst'],
  'immigration attorney': ['immigration attorney', 'immigration lawyer', 'visa attorney', 'immigration counsel', 'work visa specialist'],
  'real estate lawyer': ['real estate lawyer', 'real estate attorney', 'property lawyer', 'real estate counsel', 'land use attorney'],
  'securities lawyer': ['securities lawyer', 'securities attorney', 'capital markets lawyer', 'sec attorney', 'securities counsel', 'finance lawyer'],
  'environmental lawyer': ['environmental lawyer', 'environmental attorney', 'environmental counsel', 'climate lawyer', 'sustainability lawyer'],

  // ===== CUSTOMER SUCCESS =====
  'customer success manager': ['customer success manager', 'csm', 'client success manager', 'customer success lead', 'customer success specialist', 'cs manager'],
  'customer support specialist': ['customer support specialist', 'support specialist', 'customer service representative', 'support agent', 'help desk specialist', 'customer care specialist', 'support rep'],
  'support engineer': ['support engineer', 'technical support engineer', 'customer engineer', 'support developer', 'l2 support engineer', 'escalation engineer', 'product support engineer'],
  'technical account manager': ['technical account manager', 'tam', 'technical customer manager', 'strategic technical manager', 'enterprise tam', 'technical relationship manager'],
  'customer experience manager': ['customer experience manager', 'cx manager', 'customer experience lead', 'experience manager', 'customer journey manager'],
  'implementation specialist': ['implementation specialist', 'implementation consultant', 'implementation manager', 'onboarding specialist', 'deployment specialist', 'solutions implementation specialist'],
  'onboarding manager': ['onboarding manager', 'customer onboarding manager', 'client onboarding specialist', 'onboarding lead', 'implementation manager'],
  'client relations manager': ['client relations manager', 'client relationship manager', 'relationship manager', 'client manager', 'client partner', 'client engagement manager'],
  'customer advocacy manager': ['customer advocacy manager', 'customer advocate', 'voice of customer manager', 'customer champion', 'customer marketing manager'],
  'renewals manager': ['renewals manager', 'renewal specialist', 'retention manager', 'renewal sales manager', 'customer retention manager', 'renewal account manager'],
  'customer operations analyst': ['customer operations analyst', 'cs operations analyst', 'customer ops analyst', 'support operations analyst', 'service operations analyst'],
  'support team lead': ['support team lead', 'support manager', 'customer support lead', 'support supervisor', 'help desk manager', 'service desk lead'],
  'customer education specialist': ['customer education specialist', 'customer trainer', 'product trainer', 'customer enablement specialist', 'training specialist', 'education manager'],
  'voice of customer analyst': ['voice of customer analyst', 'voc analyst', 'customer feedback analyst', 'customer insights analyst', 'nps analyst', 'csat analyst'],
  'customer insights analyst': ['customer insights analyst', 'consumer insights analyst', 'customer research analyst', 'customer analytics analyst', 'user insights analyst'],
  'help desk analyst': ['help desk analyst', 'help desk technician', 'it help desk', 'service desk analyst', 'desktop support analyst', 'it support analyst'],
  'escalation manager': ['escalation manager', 'escalation engineer', 'critical accounts manager', 'crisis manager', 'incident manager', 'escalation lead'],
  'customer retention specialist': ['customer retention specialist', 'retention specialist', 'churn prevention specialist', 'save specialist', 'loyalty specialist', 'winback specialist'],
  'service delivery manager': ['service delivery manager', 'sdm', 'delivery manager', 'service manager', 'it service manager', 'managed services manager'],
  'customer health analyst': ['customer health analyst', 'customer health score analyst', 'cs analyst', 'customer risk analyst', 'account health analyst'],
  'solutions architect': ['solutions architect', 'solution architect', 'technical architect', 'enterprise architect', 'cloud solutions architect', 'pre-sales architect', 'customer solutions architect'],
};

// Merge all into ROLE_SYNONYMS
Object.assign(ROLE_SYNONYMS, FINANCE_SYNONYMS);

// Helper function to get synonyms for a role (case-insensitive lookup)
// Words that are level/title modifiers, not core role identifiers
const MODIFIER_WORDS = new Set([
  'senior', 'junior', 'lead', 'staff', 'principal', 'associate', 'assistant',
  'head', 'chief', 'vp', 'director', 'manager', 'sr', 'jr', 'i', 'ii', 'iii',
  'iv', 'v', 'vi', 'level', 'tier', 'executive', 'entry', 'mid', 'intern',
  'founding', 'distinguished', 'fellow', 'advisory', 'global', 'regional',
]);

export function getRoleSynonyms(role: string): string[] {
  const key = role.toLowerCase();
  if (ROLE_SYNONYMS[key]) return ROLE_SYNONYMS[key];
  // Separate core words from modifier words
  const allWords = key.split(/\s+/).filter(w => w.length >= 2);
  const coreWords = allWords.filter(w => !MODIFIER_WORDS.has(w));
  // Collect: full phrase + synonyms matched by core words only
  const matches = new Set<string>([key]);
  // Add the core words joined as a phrase (e.g. "software engineer" from "senior software engineer")
  if (coreWords.length > 1) {
    matches.add(coreWords.join(' '));
  }
  // Look up synonym entries using the core phrase and individual core words
  for (const [k, v] of Object.entries(ROLE_SYNONYMS)) {
    // Match if the synonym key contains the full core phrase
    const corePhrase = coreWords.join(' ');
    if (corePhrase && (k.includes(corePhrase) || corePhrase.includes(k))) {
      for (const s of v) matches.add(s);
    } else {
      // Match if the synonym key contains ALL core words (not just any one)
      if (coreWords.length > 0 && coreWords.every(w => k.includes(w))) {
        for (const s of v) matches.add(s);
      }
    }
  }
  // If no synonym matches found, add individual core words as fallback keywords
  if (matches.size <= 2) {
    for (const word of coreWords) {
      matches.add(word);
    }
  }
  return [...matches];
}

// Expand a list of desired roles into all their synonyms (for client-side filtering)
export function expandRolesWithSynonyms(roles: string[]): string[] {
  const expanded = new Set<string>();
  for (const role of roles) {
    const synonyms = getRoleSynonyms(role);
    // Cap per role to prevent query explosion from broad single-word roles
    const capped = synonyms.slice(0, 50);
    for (const s of capped) {
      expanded.add(s);
    }
  }
  return [...expanded];
}
