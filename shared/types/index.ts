export interface Job {
    id: string;
    companyName: string;
    companyLogo: string;
    companyLinkedIn?: string;
    jobTitle: string;
    location: string;
    locationType: 'remote' | 'onsite' | 'hybrid';
    postedDate: string;
    matchScore: number;
    /** 'adjacent' = a transferable role from a neighbouring career (lib/feed-policy). */
    relevanceTier?: 'core' | 'adjacent';
    /** Canonical cities / countries from jobs.loc_cities / loc_countries (location tiers). */
    locCities?: string[];
    locCountries?: string[];
    salaryMin: number;
    salaryMax: number;
    salaryCurrency: string;
    salaryPeriod: string;
    employmentType: string;
    experienceLevel: string;
    description: string;
    companyDescription: string;
    detailedRequirements: string;
    culturePhotos: string[];
    requirements: string[];
    skills: string[];
    benefits: string[];
    applicantsCount: number;
    deadline: string | null;
    portal?: string;
    portalUrl?: string;
    jobUrl?: string;
    companyWebsite?: string;
    salaryRangeRaw?: string;
    jobLevel?: string;
    jobRequirements?: string[];
    industry?: string;
    companySize?: string;
    companyType?: string;
    educationLevel?: string;
    workAuthorization?: string;
    fitWriteup?: string;
  }
  
  export interface Match {
    id: string;
    job: Job;
    matchedDate: string;
    status: 'new' | 'viewed' | 'awaiting' | 'interview_scheduled' | 'interested';
    lastMessage: string | null;
    unreadCount: number;
    companyInterest?: string;
  }
  
  export interface Conversation {
    id: string;
    companyName: string;
    companyLogo: string;
    recruiterName: string;
    jobTitle: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    isOnline: boolean;
    category?: 'new' | 'follow_up' | 'active';
  }
  
  export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: string;
    isRead: boolean;
    isDelivered?: boolean;
    attachmentType?: 'image' | 'file' | 'pdf' | null;
    attachmentName?: string;
  }
  
  export type ApplicationStatus = 'pending' | 'processing' | 'applied' | 'under_review' | 'interviewing' | 'interview_scheduled' | 'offer' | 'rejected' | 'withdrawn' | 'completed' | 'failed' | 'submitted';

  export interface Application {
    id: string;
    job: Job;
    appliedDate: string;
    status: ApplicationStatus;
    lastActivity: string;
    interviewDate: string | null;
    interviewTime: string | null;
    meetingLink: string | null;
    meetingPlatform: 'google_meet' | 'zoom' | 'microsoft_teams' | null;
    verificationOtp: string | null;
    otpReceivedAt: string | null;
    appliedByIris?: boolean;
  }

  export interface DbApplicationRow {
    id: string;
    user_id: string;
    job_id: string;
    company_name: string;
    job_title: string;
    job_url: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    location: string | null;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string | null;
    interview_date: string | null;
    interview_time: string | null;
    meeting_link: string | null;
    meeting_platform: string | null;
    verification_otp: string | null;
    otp_received_at: string | null;
    company_logo?: string | null;
    company_logo_url?: string | null;
    applied_by?: string | null;
  }

  export interface DbProfileRow {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    subscription_type: string | null;
    education: Education[] | null;
    headline: string | null;
    location: string | null;
    bio: string | null;
    phone: string | null;
    skills: string[] | null;
    experience: WorkExperience[] | null;
  }

  export interface DbCompanyRow {
    name: string;
    logo_url: string | null;
    logo: string | null;
    industry: string | null;
    location: string | null;
    website: string | null;
    linkedin: string | null;
    description: string | null;
    size: string | null;
    company_type: string | null;
  }
  
  export interface WorkExperience {
    id: string;
    company: string;
    title: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    description: string;
    skills?: string[];
    employmentType?: string;
    workMode?: string;
    jobLocation?: string;
  }
  
  export interface Education {
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    description?: string;
    achievements?: string;
    extracurriculars?: string;
  }
  
  export interface Certification {
    id: string;
    name: string;
    issuingOrganization: string;
    credentialUrl: string;
    skills: string[];
  }
  
  export interface Achievement {
    id: string;
    title: string;
    issuer: string;
    date: string;
    description?: string;
  }
  
  export interface Resume {
    id: string;
    name: string;
    fileName: string;
    uploadDate: string;
    isActive: boolean;
  }

  export interface Project {
    id: string;
    title: string;
    organization: string;
    date: string;
    exposure: string[];
    bullets: string[];
    link?: string;
  }

  export interface UserDocument {
    id: string;
    name: string;
    type: 'transcript' | 'certificate' | 'degree' | 'other';
    fileUrl: string;
    fileName: string;
    uploadedAt: string;
  }
  
  export interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    headline: string;
    location: string;
    avatar: string;
    bio: string;
    profileCompletion: number;
    totalApplications: number;
    interviewsScheduled: number;
    matchRate: number;
    profileViews: number;
    skills: string[];
    topSkills: string[];
    experience: WorkExperience[];
    education: Education[];
    certifications: Certification[];
    achievements: Achievement[];
    jobPreferences: string[];
    workModePreferences: string[];
    salaryCurrency: string;
    salaryMinPref: number;
    salaryMaxPref: number;
    linkedinUrl?: string;
    githubUrl?: string;
    isProfileVerified?: boolean;
    veteranStatus?: string;
    disabilityStatus?: string;
    ethnicity?: string;
    race?: string;
    gender?: string;
    countryCode?: string;
    openToRelocation?: boolean | null;
    authorizedToWork?: boolean | null;
    needsSponsorship?: boolean | null;
    openToInPerson?: boolean | null;
    willingToRelocate?: boolean | null;
    canStartImmediately?: boolean | null;
    hasReliableTransport?: boolean | null;
    needsAccommodations?: 'no' | 'yes' | 'prefer_not' | null;
    additionalInfo?: string;
    resumeOptimizationLevel?: 'off' | 'honest' | 'aggressive';
    resumeUrl?: string;
    experienceLevel?: string;
    desiredRoleCategories?: string[];
    desiredRoles?: string[];
    preferredCities?: string[];
    /** Home location + preferred cities, normalized by the database (profiles.near_*). */
    nearCities?: string[];
    nearCountries?: string[];
    workProfessions?: string[];
    onboardingData?: Record<string, unknown>;
    coverLetter?: string;
    workAuthorizationStatus?: string;
    jobRequirements?: string[];
    favoriteCompanies?: string[];
    preferredWorkLocations?: string[];
    workdayEmail?: string;
    workdayPassword?: string;
    jobleverEmail?: string;
    jobleverPassword?: string;
    greenhouseEmail?: string;
    greenhousePassword?: string;
    taleoEmail?: string;
    taleoPassword?: string;
    projects?: Project[];
    documents?: UserDocument[];
    updatedAt?: string;
  }
  