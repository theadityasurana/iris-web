export const AuthColors = {
    bg: '#FFFFFF',
    bgGradientMid: '#FFFFFF',
    bgGradientEnd: '#FFFFFF',
    surface: '#F5F5F5',
    surfaceHover: '#EEEEEE',
    border: '#E0E0E0',
    borderFocus: '#111111',
    accent: '#111111',
    accentSoft: 'rgba(0, 0, 0, 0.06)',
    accentDark: '#000000',
    success: '#10B981',
    successSoft: 'rgba(16, 185, 129, 0.1)',
    error: '#EF4444',
    errorSoft: 'rgba(239, 68, 68, 0.1)',
    text: '#111111',
    textSecondary: '#616161',
    textMuted: '#9E9E9E',
    chipBg: 'rgba(0, 0, 0, 0.06)',
    chipBorder: 'rgba(0, 0, 0, 0.2)',
    chipSelectedBg: '#111111',
    gold: '#F59E0B',
    goldSoft: 'rgba(245, 158, 11, 0.1)',
  };
  
  export const countryCodes = [
    { code: '+1', country: 'United States', flag: '🇺🇸' },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+55', country: 'Brazil', flag: '🇧🇷' },
    { code: '+82', country: 'South Korea', flag: '🇰🇷' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
    { code: '+46', country: 'Sweden', flag: '🇸🇪' },
    { code: '+1', country: 'Canada', flag: '🇨🇦' },
    { code: '+7', country: 'Russia', flag: '🇷🇺' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+52', country: 'Mexico', flag: '🇲🇽' },
    { code: '+48', country: 'Poland', flag: '🇵🇱' },
  ];
  
  export const suggestedSkills = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust', 'Swift',
    'Kotlin', 'Ruby', 'PHP', 'Perl', 'Scala', 'R', 'MATLAB', 'Dart', 'Lua', 'Haskell',
    'Elixir', 'Erlang', 'Clojure', 'F#', 'Objective-C', 'Assembly', 'COBOL', 'Fortran',
    'Groovy', 'Julia', 'Solidity', 'VHDL', 'Verilog', 'Bash', 'Shell Scripting', 'PowerShell',
    'VBA', 'Apex', 'ABAP', 'Prolog', 'Lisp', 'OCaml', 'Zig', 'Nim', 'Crystal',
    // Frontend
    'React', 'React Native', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js', 'Gatsby',
    'HTML', 'CSS', 'HTML/CSS', 'SASS', 'SCSS', 'Less', 'Tailwind CSS', 'Bootstrap',
    'Material UI', 'Chakra UI', 'Ant Design', 'Styled Components', 'Emotion', 'Framer Motion',
    'Three.js', 'D3.js', 'WebGL', 'Canvas API', 'SVG', 'Responsive Design', 'CSS Grid',
    'Flexbox', 'Web Components', 'Shadow DOM', 'Progressive Web Apps', 'Service Workers',
    'Webpack', 'Vite', 'Rollup', 'Parcel', 'esbuild', 'Babel', 'PostCSS', 'Storybook',
    'Astro', 'Remix', 'SolidJS', 'Alpine.js', 'HTMX', 'Lit', 'Qwik',
    // Backend
    'Node.js', 'Express.js', 'Fastify', 'NestJS', 'Django', 'Flask', 'FastAPI',
    'Spring Boot', 'Spring Framework', 'Ruby on Rails', 'Laravel', 'Symfony',
    'ASP.NET', '.NET Core', 'Phoenix', 'Gin', 'Echo', 'Fiber', 'Actix', 'Rocket',
    'Koa', 'Hapi', 'Strapi', 'KeystoneJS', 'Adonis.js', 'Sails.js',
    // Mobile
    'iOS Development', 'Android Development', 'Flutter', 'SwiftUI', 'Jetpack Compose',
    'Xamarin', 'Ionic', 'Capacitor', 'Expo', 'Mobile UI Design', 'App Store Optimization',
    // Databases
    'SQL', 'PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'Redis', 'Elasticsearch',
    'DynamoDB', 'Cassandra', 'CouchDB', 'Neo4j', 'InfluxDB', 'TimescaleDB',
    'MariaDB', 'Oracle DB', 'SQL Server', 'Supabase', 'Firebase Realtime DB',
    'Firestore', 'PlanetScale', 'CockroachDB', 'FaunaDB', 'Prisma', 'Drizzle ORM',
    'TypeORM', 'Sequelize', 'Mongoose', 'Knex.js', 'Database Design', 'Data Modeling',
    // Cloud & Infrastructure
    'AWS', 'Azure', 'Google Cloud Platform', 'Heroku', 'Vercel', 'Netlify', 'Cloudflare',
    'DigitalOcean', 'Linode', 'AWS Lambda', 'AWS EC2', 'AWS S3', 'AWS RDS', 'AWS ECS',
    'AWS EKS', 'AWS CloudFormation', 'AWS CDK', 'AWS SQS', 'AWS SNS', 'AWS API Gateway',
    'Azure Functions', 'Azure DevOps', 'Google Cloud Functions', 'Cloud Run',
    'BigQuery', 'Cloud Storage', 'Serverless', 'Edge Computing', 'CDN',
    // DevOps & Tools
    'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Puppet', 'Chef', 'Vagrant',
    'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI', 'Travis CI', 'ArgoCD',
    'Helm', 'Istio', 'Prometheus', 'Grafana', 'Datadog', 'New Relic', 'Splunk',
    'ELK Stack', 'Nginx', 'Apache', 'HAProxy', 'Traefik', 'Consul', 'Vault',
    'Packer', 'Pulumi', 'CloudWatch', 'PagerDuty', 'OpsGenie',
    'DevOps', 'CI/CD', 'Infrastructure as Code', 'Site Reliability Engineering',
    'Monitoring', 'Logging', 'Observability', 'Incident Management',
    // Version Control
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial',
    // APIs & Protocols
    'REST APIs', 'GraphQL', 'gRPC', 'WebSockets', 'SOAP', 'OAuth', 'JWT',
    'OpenAPI', 'Swagger', 'Postman', 'API Design', 'API Gateway', 'Webhooks',
    'Server-Sent Events', 'MQTT', 'AMQP', 'Protocol Buffers', 'Apache Kafka',
    'RabbitMQ', 'Redis Pub/Sub', 'Event-Driven Architecture', 'Microservices',
    // Data & AI/ML
    'Data Science', 'Machine Learning', 'Deep Learning', 'Natural Language Processing',
    'Computer Vision', 'Reinforcement Learning', 'TensorFlow', 'PyTorch', 'Keras',
    'scikit-learn', 'Pandas', 'NumPy', 'SciPy', 'Matplotlib', 'Seaborn',
    'Jupyter Notebooks', 'Apache Spark', 'Hadoop', 'Airflow', 'dbt',
    'Data Engineering', 'ETL', 'Data Warehousing', 'Data Pipelines',
    'Feature Engineering', 'Model Deployment', 'MLOps', 'LLMs', 'GPT',
    'Langchain', 'Hugging Face', 'OpenAI API', 'Stable Diffusion', 'RAG',
    'Vector Databases', 'Pinecone', 'Weaviate', 'Chroma', 'FAISS',
    'Generative AI', 'Prompt Engineering', 'Fine-tuning', 'Transfer Learning',
    'XGBoost', 'LightGBM', 'CatBoost', 'Random Forest', 'Neural Networks',
    'CNNs', 'RNNs', 'Transformers', 'GANs', 'Autoencoders',
    // Data Analytics & BI
    'Tableau', 'Power BI', 'Looker', 'Metabase', 'Google Analytics',
    'Mixpanel', 'Amplitude', 'Segment', 'Snowflake', 'Redshift',
    'Data Visualization', 'Statistical Analysis', 'A/B Testing', 'Hypothesis Testing',
    'Regression Analysis', 'Time Series Analysis', 'Predictive Analytics',
    'Business Intelligence', 'KPI Tracking', 'Dashboard Design', 'Excel',
    'Google Sheets', 'SPSS', 'SAS', 'Stata',
    // Security
    'Cybersecurity', 'Penetration Testing', 'Ethical Hacking', 'OWASP',
    'Network Security', 'Application Security', 'Cloud Security', 'SOC',
    'SIEM', 'Vulnerability Assessment', 'Encryption', 'SSL/TLS',
    'Identity Management', 'Zero Trust', 'Compliance', 'GDPR', 'HIPAA',
    'SOC 2', 'ISO 27001', 'Security Auditing', 'Threat Modeling',
    'Incident Response', 'Forensics', 'Malware Analysis', 'Firewalls', 'VPN',
    // Testing & QA
    'Unit Testing', 'Integration Testing', 'End-to-End Testing', 'Jest', 'Mocha',
    'Cypress', 'Playwright', 'Selenium', 'Puppeteer', 'Testing Library',
    'Test-Driven Development', 'Behavior-Driven Development', 'Load Testing',
    'Performance Testing', 'JMeter', 'k6', 'Locust', 'Appium', 'Detox',
    'QA Automation', 'Manual Testing', 'Regression Testing', 'Smoke Testing',
    // Design & UX
    'Figma', 'Sketch', 'Adobe XD', 'InVision', 'Zeplin', 'Framer',
    'UI/UX Design', 'User Research', 'Wireframing', 'Prototyping',
    'Design Systems', 'Interaction Design', 'Visual Design', 'Typography',
    'Color Theory', 'Accessibility', 'WCAG', 'Information Architecture',
    'Usability Testing', 'Design Thinking', 'Adobe Photoshop', 'Adobe Illustrator',
    'Adobe After Effects', 'Adobe Premiere Pro', 'Canva', 'Motion Graphics',
    'Animation', '3D Modeling', 'Blender', 'Cinema 4D', 'Unity',
    // Project Management & Methodologies
    'Agile', 'Scrum', 'Kanban', 'Lean', 'Waterfall', 'SAFe',
    'Jira', 'Confluence', 'Trello', 'Asana', 'Monday.com', 'Notion',
    'Linear', 'ClickUp', 'Basecamp', 'Microsoft Project',
    'Product Management', 'Product Strategy', 'Roadmapping', 'OKRs',
    'Sprint Planning', 'Backlog Grooming', 'Retrospectives', 'Stakeholder Management',
    'Risk Management', 'Change Management', 'Resource Planning',
    // Marketing & Growth
    'SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'LinkedIn Ads', 'TikTok Ads',
    'Content Marketing', 'Email Marketing', 'Social Media Marketing',
    'Influencer Marketing', 'Affiliate Marketing', 'Growth Hacking',
    'Conversion Rate Optimization', 'Marketing Automation', 'HubSpot',
    'Mailchimp', 'Marketo', 'Salesforce Marketing Cloud', 'Google Tag Manager',
    'Copywriting', 'Brand Strategy', 'Public Relations', 'Community Management',
    // Sales & CRM
    'Salesforce', 'HubSpot CRM', 'Pipedrive', 'Zoho CRM', 'Outreach',
    'Sales Strategy', 'Lead Generation', 'Cold Outreach', 'Negotiation',
    'Account Management', 'Customer Success', 'Upselling', 'Cross-selling',
    // Business & Finance
    'Financial Modeling', 'Financial Analysis', 'Budgeting', 'Forecasting',
    'Accounting', 'Bookkeeping', 'QuickBooks', 'SAP', 'ERP Systems',
    'Business Strategy', 'Market Research', 'Competitive Analysis',
    'Business Development', 'Partnership Management', 'Venture Capital',
    'Due Diligence', 'Mergers & Acquisitions', 'IPO Preparation',
    // Blockchain & Web3
    'Blockchain', 'Ethereum', 'Smart Contracts', 'Solidity', 'Web3.js',
    'Ethers.js', 'DeFi', 'NFTs', 'Tokenomics', 'Consensus Mechanisms',
    'Hyperledger', 'Polygon', 'Solana', 'Rust (Solana)', 'IPFS',
    // Soft Skills
    'Leadership', 'Communication', 'Teamwork', 'Problem Solving',
    'Critical Thinking', 'Time Management', 'Adaptability', 'Creativity',
    'Emotional Intelligence', 'Conflict Resolution', 'Mentoring',
    'Public Speaking', 'Presentation Skills', 'Technical Writing',
    'Documentation', 'Cross-functional Collaboration', 'Remote Work',
    'Decision Making', 'Strategic Thinking', 'Analytical Thinking',
    // Other Technical
    'Linux', 'Unix', 'Windows Server', 'Networking', 'TCP/IP', 'DNS',
    'Load Balancing', 'Caching', 'CDN', 'System Design', 'Distributed Systems',
    'High Availability', 'Scalability', 'Performance Optimization',
    'Embedded Systems', 'IoT', 'Raspberry Pi', 'Arduino', 'FPGA',
    'Robotics', 'ROS', 'CAD', 'AutoCAD', 'SolidWorks',
    'Game Development', 'Unreal Engine', 'Godot', 'OpenGL', 'Vulkan',
    'AR/VR', 'Mixed Reality', 'WebXR',
    'Low-Code', 'No-Code', 'Zapier', 'Make', 'Retool', 'Bubble',
    'WordPress', 'Shopify', 'Webflow', 'Squarespace', 'Wix',
    'Stripe', 'Payment Integration', 'Twilio', 'SendGrid',
    'OAuth 2.0', 'SAML', 'SSO', 'LDAP', 'Active Directory',
  ];
  
  export const employmentTypes = [
    'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance',
  ];
  
  export const degreeTypes = [
    'High School', "Associate's", "Bachelor's", "Master's", 'PhD', 'MBA', 'Other',
  ];
  
  export const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  ];
  
  export const suggestedRoles = [
  // Software & Engineering
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Mobile Developer', 'DevOps Engineer', 'Data Scientist', 'Machine Learning Engineer',
  'Cloud Architect', 'Security Engineer', 'QA Engineer', 'Systems Architect',
  'Engineering Manager', 'CTO', 'VP of Engineering', 'Technical Lead',
  // Product
  'Product Manager', 'Senior Product Manager', 'Product Owner', 'Technical Product Manager',
  'VP of Product', 'Chief Product Officer', 'Product Analyst', 'Product Designer',
  'Product Operations Manager', 'Product Marketing Manager',
  // Design
  'UX Designer', 'UI Designer', 'UX/UI Designer', 'Graphic Designer',
  'Brand Designer', 'Motion Designer', 'Design Lead', 'Creative Director',
  // Marketing
  'Marketing Manager', 'Digital Marketing Manager', 'Content Marketing Manager',
  'Growth Marketing Manager', 'Performance Marketing Manager', 'SEO Specialist',
  'Social Media Manager', 'Brand Manager', 'Marketing Director', 'CMO',
  'Email Marketing Specialist', 'Marketing Analyst', 'Demand Generation Manager',
  'Field Marketing Manager', 'Content Strategist',
  'Copywriter', 'Marketing Operations Manager',
  // Sales
  'Sales Representative', 'Account Executive', 'Sales Manager', 'Business Development Manager',
  'Sales Director', 'VP of Sales', 'Chief Revenue Officer', 'Inside Sales Representative',
  'Outside Sales Representative', 'Sales Engineer', 'Solutions Consultant',
  'Enterprise Account Executive', 'Customer Success Manager', 'Account Manager',
  'Sales Operations Manager', 'Revenue Operations Manager',
  // Growth
  'Growth Manager', 'Growth Lead', 'Growth Hacker', 'VP of Growth',
  'User Acquisition Manager', 'Retention Manager', 'Conversion Rate Optimizer',
  'Growth Product Manager', 'Growth Analyst', 'Lifecycle Marketing Manager',
  // Data & Analytics
  'Data Analyst', 'Business Intelligence Analyst', 'Analytics Manager',
  'Data Engineer', 'Business Analyst', 'Operations Analyst',
  // Operations
  'Operations Manager', 'Chief Operating Officer', 'Program Manager',
  'Project Manager', 'Scrum Master', 'Agile Coach',
  // HR & Recruiting
  'Recruiter', 'Technical Recruiter', 'HR Manager', 'Talent Acquisition Manager',
  'People Operations Manager', 'Chief People Officer',
  // Finance
  'Financial Analyst', 'Accountant', 'Finance Manager', 'CFO',
  // Customer Support
  'Customer Support Specialist', 'Support Manager',
  // Other
  'Technical Writer', 'Community Manager', 'Partnerships Manager',
];
  
  export const majorCities = [
  // India  - Major Metros
  'Bangalore, India', 'Mumbai, India', 'Delhi, India', 'Hyderabad, India', 'Pune, India',
  'Chennai, India', 'Kolkata, India', 'Gurugram, India', 'Noida, India', 'Ahmedabad, India',
  'Jaipur, India', 'Chandigarh, India', 'Kochi, India',
  // India  - Tier 1 & 2
  'Lucknow, India', 'Indore, India', 'Coimbatore, India', 'Nagpur, India', 'Bhopal, India',
  'Visakhapatnam, India', 'Patna, India', 'Vadodara, India', 'Surat, India', 'Rajkot, India',
  'Ludhiana, India', 'Agra, India', 'Nashik, India', 'Varanasi, India', 'Madurai, India',
  'Meerut, India', 'Faridabad, India', 'Ghaziabad, India', 'Ranchi, India', 'Jodhpur, India',
  'Raipur, India', 'Amritsar, India', 'Allahabad, India', 'Vijayawada, India', 'Gwalior, India',
  'Jabalpur, India', 'Thiruvananthapuram, India', 'Mysore, India', 'Tiruchirappalli, India',
  'Hubli, India', 'Salem, India', 'Bareilly, India', 'Moradabad, India', 'Aligarh, India',
  'Gorakhpur, India', 'Mangalore, India', 'Belgaum, India', 'Ambattur, India',
  'Tirunelveli, India', 'Udaipur, India', 'Kota, India', 'Ajmer, India', 'Bikaner, India',
  'Bhilai, India', 'Warangal, India', 'Guntur, India', 'Nellore, India', 'Kakinada, India',
  'Dehradun, India', 'Haridwar, India', 'Jammu, India', 'Srinagar, India',
  'Guwahati, India', 'Dibrugarh, India', 'Silchar, India', 'Jorhat, India',
  'Shillong, India', 'Imphal, India', 'Agartala, India', 'Aizawl, India',
  'Itanagar, India', 'Kohima, India', 'Gangtok, India',
  'Bhubaneswar, India', 'Cuttack, India', 'Rourkela, India', 'Berhampur, India',
  'Jamshedpur, India', 'Dhanbad, India', 'Bokaro, India', 'Hazaribagh, India',
  'Durgapur, India', 'Asansol, India', 'Siliguri, India', 'Howrah, India',
  'Panaji, India', 'Margao, India', 'Vasco da Gama, India',
  'Shimla, India', 'Manali, India', 'Dharamshala, India',
  'Pondicherry, India', 'Karaikal, India',
  'Aurangabad, India', 'Solapur, India', 'Kolhapur, India', 'Sangli, India',
  'Nanded, India', 'Amravati, India', 'Akola, India', 'Latur, India',
  'Jalandhar, India', 'Patiala, India', 'Bathinda, India', 'Mohali, India',
  'Karnal, India', 'Panipat, India', 'Hisar, India', 'Rohtak, India',
  'Mathura, India', 'Firozabad, India', 'Saharanpur, India', 'Muzaffarnagar, India',
  'Kanpur, India', 'Prayagraj, India', 'Jhansi, India', 'Ayodhya, India',
  'Sultanpur, India', 'Unnao, India',
  'Bilaspur, India', 'Korba, India', 'Durg, India',
  'Ujjain, India', 'Sagar, India', 'Satna, India', 'Rewa, India',
  'Erode, India', 'Vellore, India', 'Thanjavur, India', 'Dindigul, India',
  'Nagercoil, India', 'Thoothukudi, India',
  'Thrissur, India', 'Kozhikode, India', 'Kollam, India', 'Palakkad, India',
  'Alappuzha, India', 'Kannur, India',
  'Bellary, India', 'Davangere, India', 'Shimoga, India', 'Tumkur, India',
  'Gulbarga, India', 'Bijapur, India',
  'Anantapur, India', 'Kurnool, India', 'Tirupati, India', 'Rajahmundry, India',
  'Eluru, India', 'Ongole, India', 'Kadapa, India',
  'Bhagalpur, India', 'Muzaffarpur, India', 'Gaya, India', 'Darbhanga, India',
  'Purnia, India', 'Begusarai, India',
  'Sambalpur, India', 'Balasore, India', 'Puri, India',
  'Silvassa, India', 'Daman, India', 'Kavaratti, India', 'Port Blair, India',
  // United States  - Major Tech & Business Hubs
  'San Francisco, CA, USA', 'New York, NY, USA', 'Seattle, WA, USA', 'Austin, TX, USA',
  'Los Angeles, CA, USA', 'Chicago, IL, USA', 'Boston, MA, USA', 'Denver, CO, USA',
  'Portland, OR, USA', 'Miami, FL, USA', 'Atlanta, GA, USA', 'Dallas, TX, USA',
  'Houston, TX, USA', 'Phoenix, AZ, USA', 'San Diego, CA, USA', 'Philadelphia, PA, USA',
  'Washington, DC, USA', 'Nashville, TN, USA', 'Detroit, MI, USA', 'Minneapolis, MN, USA',
  // United States  - Silicon Valley & Bay Area
  'San Jose, CA, USA', 'Palo Alto, CA, USA', 'Mountain View, CA, USA', 'Sunnyvale, CA, USA',
  'Cupertino, CA, USA', 'Santa Clara, CA, USA', 'Menlo Park, CA, USA', 'Redwood City, CA, USA',
  'Fremont, CA, USA', 'Oakland, CA, USA', 'Berkeley, CA, USA', 'South San Francisco, CA, USA',
  'Foster City, CA, USA', 'Pleasanton, CA, USA', 'Walnut Creek, CA, USA', 'Hayward, CA, USA',
  // United States  - Southern California
  'Irvine, CA, USA', 'Santa Monica, CA, USA', 'Pasadena, CA, USA', 'Long Beach, CA, USA',
  'Burbank, CA, USA', 'Glendale, CA, USA', 'Anaheim, CA, USA', 'Costa Mesa, CA, USA',
  'Carlsbad, CA, USA', 'Oceanside, CA, USA', 'Riverside, CA, USA', 'Ontario, CA, USA',
  // United States  - Other California
  'Sacramento, CA, USA', 'Fresno, CA, USA', 'Santa Barbara, CA, USA', 'San Luis Obispo, CA, USA',
  'Santa Cruz, CA, USA', 'Stockton, CA, USA', 'Bakersfield, CA, USA', 'Modesto, CA, USA',
  // United States  - Pacific Northwest
  'Bellevue, WA, USA', 'Redmond, WA, USA', 'Kirkland, WA, USA', 'Tacoma, WA, USA',
  'Spokane, WA, USA', 'Olympia, WA, USA', 'Boise, ID, USA', 'Eugene, OR, USA', 'Salem, OR, USA',
  // United States  - Texas
  'San Antonio, TX, USA', 'Fort Worth, TX, USA', 'El Paso, TX, USA', 'Plano, TX, USA',
  'Irving, TX, USA', 'Frisco, TX, USA', 'Arlington, TX, USA', 'Round Rock, TX, USA',
  'McKinney, TX, USA', 'Lubbock, TX, USA', 'Corpus Christi, TX, USA', 'Amarillo, TX, USA',
  // United States  - Southeast
  'Charlotte, NC, USA', 'Raleigh, NC, USA', 'Durham, NC, USA', 'Charleston, SC, USA',
  'Greenville, SC, USA', 'Tampa, FL, USA', 'Orlando, FL, USA', 'Jacksonville, FL, USA',
  'Fort Lauderdale, FL, USA', 'St. Petersburg, FL, USA', 'Sarasota, FL, USA',
  'West Palm Beach, FL, USA', 'Boca Raton, FL, USA', 'Tallahassee, FL, USA',
  'Savannah, GA, USA', 'Birmingham, AL, USA', 'Huntsville, AL, USA',
  'New Orleans, LA, USA', 'Baton Rouge, LA, USA', 'Memphis, TN, USA', 'Knoxville, TN, USA',
  'Chattanooga, TN, USA', 'Richmond, VA, USA', 'Virginia Beach, VA, USA', 'Arlington, VA, USA',
  'Reston, VA, USA', 'McLean, VA, USA', 'Tysons, VA, USA',
  // United States  - Northeast
  'Newark, NJ, USA', 'Jersey City, NJ, USA', 'Princeton, NJ, USA', 'Hoboken, NJ, USA',
  'Stamford, CT, USA', 'Hartford, CT, USA', 'New Haven, CT, USA', 'Providence, RI, USA',
  'Pittsburgh, PA, USA', 'Baltimore, MD, USA', 'Bethesda, MD, USA', 'Columbia, MD, USA',
  'Cambridge, MA, USA', 'Worcester, MA, USA', 'Albany, NY, USA', 'Buffalo, NY, USA',
  'Rochester, NY, USA', 'Syracuse, NY, USA', 'White Plains, NY, USA',
  // United States  - Midwest
  'Columbus, OH, USA', 'Cleveland, OH, USA', 'Cincinnati, OH, USA', 'Indianapolis, IN, USA',
  'Milwaukee, WI, USA', 'Madison, WI, USA', 'St. Louis, MO, USA', 'Kansas City, MO, USA',
  'Omaha, NE, USA', 'Des Moines, IA, USA', 'Ann Arbor, MI, USA', 'Grand Rapids, MI, USA',
  // United States  - Mountain & Southwest
  'Salt Lake City, UT, USA', 'Provo, UT, USA', 'Colorado Springs, CO, USA', 'Boulder, CO, USA',
  'Scottsdale, AZ, USA', 'Tucson, AZ, USA', 'Mesa, AZ, USA', 'Tempe, AZ, USA',
  'Las Vegas, NV, USA', 'Reno, NV, USA', 'Albuquerque, NM, USA', 'Santa Fe, NM, USA',
  // United States  - Other
  'Honolulu, HI, USA', 'Anchorage, AK, USA', 'Little Rock, AR, USA',
  'Louisville, KY, USA', 'Lexington, KY, USA', 'Oklahoma City, OK, USA', 'Tulsa, OK, USA',
  'Wichita, KS, USA', 'Sioux Falls, SD, USA', 'Fargo, ND, USA',
  'Burlington, VT, USA', 'Portland, ME, USA', 'Manchester, NH, USA',
  'Wilmington, DE, USA', 'Charleston, WV, USA', 'Jackson, MS, USA',
  'Bozeman, MT, USA', 'Cheyenne, WY, USA',
  // Canada
  'Toronto, Canada', 'Vancouver, Canada', 'Montreal, Canada', 'Calgary, Canada',
  'Ottawa, Canada', 'Edmonton, Canada', 'Winnipeg, Canada',
  // United Kingdom
  'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Edinburgh, UK', 'Bristol, UK',
  'Leeds, UK', 'Glasgow, UK', 'Liverpool, UK', 'Cambridge, UK', 'Oxford, UK',
  // Germany
  'Berlin, Germany', 'Munich, Germany', 'Frankfurt, Germany', 'Hamburg, Germany', 'Cologne, Germany',
  // Netherlands
  'Amsterdam, Netherlands', 'Rotterdam, Netherlands', 'The Hague, Netherlands', 'Utrecht, Netherlands',
  // France
  'Paris, France', 'Lyon, France', 'Marseille, France', 'Toulouse, France', 'Nice, France',
  // Europe (Other)
  'Barcelona, Spain', 'Madrid, Spain', 'Lisbon, Portugal', 'Porto, Portugal',
  'Rome, Italy', 'Milan, Italy', 'Stockholm, Sweden', 'Copenhagen, Denmark',
  'Oslo, Norway', 'Helsinki, Finland', 'Vienna, Austria', 'Zurich, Switzerland',
  'Geneva, Switzerland', 'Brussels, Belgium', 'Prague, Czech Republic', 'Warsaw, Poland',
  'Dublin, Ireland', 'Athens, Greece', 'Budapest, Hungary',
  // Middle East
  'Dubai, UAE', 'Abu Dhabi, UAE', 'Riyadh, Saudi Arabia', 'Jeddah, Saudi Arabia',
  'Doha, Qatar', 'Kuwait City, Kuwait', 'Muscat, Oman', 'Manama, Bahrain',
  'Tel Aviv, Israel', 'Jerusalem, Israel', 'Amman, Jordan', 'Beirut, Lebanon',
  // Southeast Asia
  'Singapore', 'Bangkok, Thailand', 'Jakarta, Indonesia', 'Kuala Lumpur, Malaysia',
  'Manila, Philippines', 'Ho Chi Minh City, Vietnam', 'Hanoi, Vietnam',
  'Yangon, Myanmar', 'Phnom Penh, Cambodia', 'Bali, Indonesia',
  // Australia & Others
  'Sydney, Australia', 'Melbourne, Australia', 'Tokyo, Japan', 'Seoul, South Korea',
];
  
  // Lat/lng for Indian cities  - used for GPS nearest-city matching
  export const INDIAN_CITY_COORDS: { name: string; lat: number; lng: number }[] = [
    { name: 'Bangalore, India', lat: 12.9716, lng: 77.5946 },
    { name: 'Mumbai, India', lat: 19.076, lng: 72.8777 },
    { name: 'Delhi, India', lat: 28.7041, lng: 77.1025 },
    { name: 'Hyderabad, India', lat: 17.385, lng: 78.4867 },
    { name: 'Pune, India', lat: 18.5204, lng: 73.8567 },
    { name: 'Chennai, India', lat: 13.0827, lng: 80.2707 },
    { name: 'Kolkata, India', lat: 22.5726, lng: 88.3639 },
    { name: 'Gurugram, India', lat: 28.4595, lng: 77.0266 },
    { name: 'Noida, India', lat: 28.5355, lng: 77.391 },
    { name: 'Ahmedabad, India', lat: 23.0225, lng: 72.5714 },
    { name: 'Jaipur, India', lat: 26.9124, lng: 75.7873 },
    { name: 'Chandigarh, India', lat: 30.7333, lng: 76.7794 },
    { name: 'Kochi, India', lat: 9.9312, lng: 76.2673 },
    { name: 'Lucknow, India', lat: 26.8467, lng: 80.9462 },
    { name: 'Indore, India', lat: 22.7196, lng: 75.8577 },
    { name: 'Coimbatore, India', lat: 11.0168, lng: 76.9558 },
    { name: 'Nagpur, India', lat: 21.1458, lng: 79.0882 },
    { name: 'Bhopal, India', lat: 23.2599, lng: 77.4126 },
    { name: 'Visakhapatnam, India', lat: 17.6868, lng: 83.2185 },
    { name: 'Patna, India', lat: 25.6093, lng: 85.1376 },
    { name: 'Vadodara, India', lat: 22.3072, lng: 73.1812 },
    { name: 'Surat, India', lat: 21.1702, lng: 72.8311 },
    { name: 'Rajkot, India', lat: 22.3039, lng: 70.8022 },
    { name: 'Ludhiana, India', lat: 30.901, lng: 75.8573 },
    { name: 'Agra, India', lat: 27.1767, lng: 78.0081 },
    { name: 'Nashik, India', lat: 19.9975, lng: 73.7898 },
    { name: 'Varanasi, India', lat: 25.3176, lng: 82.9739 },
    { name: 'Madurai, India', lat: 9.9252, lng: 78.1198 },
    { name: 'Meerut, India', lat: 28.9845, lng: 77.7064 },
    { name: 'Faridabad, India', lat: 28.4089, lng: 77.3178 },
    { name: 'Ghaziabad, India', lat: 28.6692, lng: 77.4538 },
    { name: 'Ranchi, India', lat: 23.3441, lng: 85.3096 },
    { name: 'Jodhpur, India', lat: 26.2389, lng: 73.0243 },
    { name: 'Raipur, India', lat: 21.2514, lng: 81.6296 },
    { name: 'Amritsar, India', lat: 31.634, lng: 74.8723 },
    { name: 'Allahabad, India', lat: 25.4358, lng: 81.8463 },
    { name: 'Vijayawada, India', lat: 16.5062, lng: 80.648 },
    { name: 'Gwalior, India', lat: 26.2183, lng: 78.1828 },
    { name: 'Jabalpur, India', lat: 23.1815, lng: 79.9864 },
    { name: 'Thiruvananthapuram, India', lat: 8.5241, lng: 76.9366 },
    { name: 'Mysore, India', lat: 12.2958, lng: 76.6394 },
    { name: 'Tiruchirappalli, India', lat: 10.7905, lng: 78.7047 },
    { name: 'Hubli, India', lat: 15.3647, lng: 75.124 },
    { name: 'Salem, India', lat: 11.6643, lng: 78.146 },
    { name: 'Mangalore, India', lat: 12.9141, lng: 74.856 },
    { name: 'Udaipur, India', lat: 24.5854, lng: 73.7125 },
    { name: 'Kota, India', lat: 25.2138, lng: 75.8648 },
    { name: 'Dehradun, India', lat: 30.3165, lng: 78.0322 },
    { name: 'Jammu, India', lat: 32.7266, lng: 74.857 },
    { name: 'Srinagar, India', lat: 34.0837, lng: 74.7973 },
    { name: 'Guwahati, India', lat: 26.1445, lng: 91.7362 },
    { name: 'Shillong, India', lat: 25.5788, lng: 91.8933 },
    { name: 'Imphal, India', lat: 24.817, lng: 93.9368 },
    { name: 'Agartala, India', lat: 23.8315, lng: 91.2868 },
    { name: 'Aizawl, India', lat: 23.7271, lng: 92.7176 },
    { name: 'Itanagar, India', lat: 27.0844, lng: 93.6053 },
    { name: 'Kohima, India', lat: 25.6751, lng: 94.1086 },
    { name: 'Gangtok, India', lat: 27.3389, lng: 88.6065 },
    { name: 'Bhubaneswar, India', lat: 20.2961, lng: 85.8245 },
    { name: 'Cuttack, India', lat: 20.4625, lng: 85.883 },
    { name: 'Jamshedpur, India', lat: 22.8046, lng: 86.2029 },
    { name: 'Dhanbad, India', lat: 23.7957, lng: 86.4304 },
    { name: 'Durgapur, India', lat: 23.5204, lng: 87.3119 },
    { name: 'Asansol, India', lat: 23.6739, lng: 86.9524 },
    { name: 'Siliguri, India', lat: 26.7271, lng: 88.3953 },
    { name: 'Panaji, India', lat: 15.4909, lng: 73.8278 },
    { name: 'Shimla, India', lat: 31.1048, lng: 77.1734 },
    { name: 'Pondicherry, India', lat: 11.9416, lng: 79.8083 },
    { name: 'Aurangabad, India', lat: 19.8762, lng: 75.3433 },
    { name: 'Solapur, India', lat: 17.6599, lng: 75.9064 },
    { name: 'Kolhapur, India', lat: 16.705, lng: 74.2433 },
    { name: 'Jalandhar, India', lat: 31.326, lng: 75.5762 },
    { name: 'Patiala, India', lat: 30.34, lng: 76.3869 },
    { name: 'Mohali, India', lat: 30.7046, lng: 76.7179 },
    { name: 'Karnal, India', lat: 29.6857, lng: 76.9905 },
    { name: 'Panipat, India', lat: 29.3909, lng: 76.9635 },
    { name: 'Kanpur, India', lat: 26.4499, lng: 80.3319 },
    { name: 'Prayagraj, India', lat: 25.4358, lng: 81.8463 },
    { name: 'Ujjain, India', lat: 23.1765, lng: 75.7885 },
    { name: 'Thrissur, India', lat: 10.5276, lng: 76.2144 },
    { name: 'Kozhikode, India', lat: 11.2588, lng: 75.7804 },
    { name: 'Kollam, India', lat: 8.8932, lng: 76.6141 },
    { name: 'Tirupati, India', lat: 13.6288, lng: 79.4192 },
    { name: 'Rajahmundry, India', lat: 17.0005, lng: 81.8040 },
    { name: 'Muzaffarpur, India', lat: 26.1209, lng: 85.3647 },
    { name: 'Gaya, India', lat: 24.7955, lng: 84.9994 },
    { name: 'Port Blair, India', lat: 11.6234, lng: 92.7265 },
  ];

  export function findNearestIndianCity(lat: number, lng: number): string {
    let nearest = INDIAN_CITY_COORDS[0];
    let minDist = Infinity;
    for (const city of INDIAN_CITY_COORDS) {
      const dlat = city.lat - lat;
      const dlng = city.lng - lng;
      const dist = dlat * dlat + dlng * dlng;
      if (dist < minDist) { minDist = dist; nearest = city; }
    }
    return nearest.name;
  }

  export const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  
  export const years = Array.from({ length: 47 }, (_, i) => String(2026 - i));
  
  export const jobTitleSuggestions = [
  // Tech
  'Software Engineer', 'Senior Software Engineer', 'Staff Engineer',
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Mobile Developer', 'iOS Developer', 'Android Developer',
  'DevOps Engineer', 'SRE', 'Cloud Engineer',
  'Data Scientist', 'ML Engineer', 'AI Researcher',
  'Engineering Manager', 'Tech Lead', 'Architect',
  // Product
  'Product Manager', 'Technical Product Manager', 'Senior Product Manager',
  'Product Owner', 'VP of Product', 'Chief Product Officer',
  // Design
  'UX Designer', 'UI Designer', 'Product Designer', 'Graphic Designer',
  // Marketing
  'Marketing Manager', 'Digital Marketing Manager', 'Content Marketing Manager',
  'Growth Marketing Manager', 'SEO Specialist', 'Social Media Manager',
  'Brand Manager', 'Marketing Director',
  // Sales
  'Sales Representative', 'Account Executive', 'Sales Manager',
  'Business Development Manager', 'Sales Director',
  // Growth
  'Growth Manager', 'Growth Engineer', 'Growth Lead', 'Growth Hacker',
];
  