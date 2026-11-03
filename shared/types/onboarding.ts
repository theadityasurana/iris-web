export interface OnboardingSkill {
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience: number;
  }
  
  export interface OnboardingWorkExp {
    id: string;
    title: string;
    company: string;
    employmentType: string;
    location: string;
    isRemote: boolean;
    startMonth: string;
    startYear: string;
    endMonth: string;
    endYear: string;
    isCurrent: boolean;
    description: string;
  }
  
  export interface OnboardingEducation {
    id: string;
    institution: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
  }
  
  export interface OnboardingProject {
    id: string;
    title: string;
    organization: string;
    date: string;
    exposure: string[];
    bullets: string[];
    link?: string;
  }

  export interface OnboardingCertification {
    id: string;
    name: string;
    issuingOrganization: string;
    credentialUrl: string;
    skills: string[];
  }

  export interface OnboardingAchievement {
    id: string;
    title: string;
    issuer: string;
    date: string;
    description?: string;
  }

  export interface OnboardingData {
    firstName: string;
    lastName: string;
    gender: 'male' | 'female' | 'prefer_not_to_say' | '';
    profilePicture: string | null;
    phone: string;
    countryCode: string;
    location: string;
    headline: string;
    linkedInUrl: string;
    githubUrl: string;
    workExperience: OnboardingWorkExp[];
    education: OnboardingEducation[];
    skills: OnboardingSkill[];
    workPreferences: string[];
    experienceLevel: string;
    desiredRoleCategories: string[];
    desiredRoles: string[];
    goal: string;
    salaryMin: number;
    salaryMax: number;
    salaryCurrency: string;
    preferredCities: string[];
    openToRelocation: boolean;
    resumeUri: string | null;
    userType: 'fresher' | 'job_switch' | 'laid_off' | '';
    veteranStatus: string;
    disabilityStatus: string;
    ethnicity: string;
    race: string;
    workAuthorizationStatus: string;
    authorizedToWork: boolean | null;
    needsSponsorship: boolean | null;
    openToInPerson: boolean | null;
    willingToRelocate: boolean | null;
    canStartImmediately: boolean | null;
    hasReliableTransport: boolean | null;
    needsAccommodations: 'no' | 'yes' | 'prefer_not' | null;
    additionalInfo: string;
    applicationPassword: string;
    resumeOptimizationLevel: 'off' | 'honest' | 'aggressive';
    referralCode: string;
    heardAboutUs: string;
    // Resume-parsed extras (auto-populated)
    projects?: OnboardingProject[];
    certifications?: OnboardingCertification[];
    achievements?: OnboardingAchievement[];
    // Persisted onboarding step (resumes from here on re-open)
    onboardingStep?: number;
  }
  
  export interface StepProps {
    data: OnboardingData;
    onUpdate: (partial: Partial<OnboardingData>) => void;
    onNext: () => void;
    onBack: () => void;
    isSubmitting?: boolean;
  }
  
  export const defaultOnboardingData: OnboardingData = {
    firstName: '',
    lastName: '',
    gender: '',
    profilePicture: null,
    phone: '',
    countryCode: '+91',
    location: '',
    headline: '',
    linkedInUrl: '',
    githubUrl: '',
    workExperience: [],
    education: [],
    skills: [],
    workPreferences: [],
    experienceLevel: '',
    desiredRoleCategories: [],
    desiredRoles: [],
    goal: '',
    salaryMin: 40000,
    salaryMax: 200000,
    salaryCurrency: 'USD',
    preferredCities: [],
    openToRelocation: false,
    resumeUri: null,
    userType: '',
    veteranStatus: '',
    disabilityStatus: '',
    ethnicity: '',
    race: '',
    workAuthorizationStatus: '',
    authorizedToWork: null,
    needsSponsorship: null,
    openToInPerson: null,
    willingToRelocate: null,
    canStartImmediately: null,
    hasReliableTransport: null,
    needsAccommodations: null,
    additionalInfo: '',
    applicationPassword: '',
    resumeOptimizationLevel: 'honest',
    referralCode: '',
    heardAboutUs: '',
    projects: [],
    certifications: [],
    achievements: [],
    onboardingStep: 1,
  };
  