export interface TextItem {
  text: string;
  bold: boolean;
  isEOL: boolean;
}

export type Line = TextItem[];
export type Lines = Line[];

export type SectionMap = { [sectionName: string]: Lines };

export type FeatureScore = -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4;
type ReturnMatchingTextOnly = boolean;
export type FeatureSet =
  | [(item: TextItem) => boolean, FeatureScore]
  | [(item: TextItem) => RegExpMatchArray | null, FeatureScore, ReturnMatchingTextOnly];

export interface TextScore {
  text: string;
  score: number;
  match: boolean;
}

export interface ParsedProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  url: string;
  linkedInUrl: string;
  githubUrl: string;
  summary: string;
}

export interface ParsedWorkExperience {
  company: string;
  jobTitle: string;
  date: string;
  descriptions: string[];
}

export interface ParsedEducation {
  school: string;
  degree: string;
  field: string;
  date: string;
  gpa: string;
  descriptions: string[];
}

export interface ParsedProject {
  title: string;
  date: string;
  descriptions: string[];
}

export interface ParsedCertification {
  name: string;
  issuer: string;
}

export interface ParsedAchievement {
  title: string;
  issuer: string;
  date: string;
}

export interface ParsedResume {
  profile: ParsedProfile;
  workExperiences: ParsedWorkExperience[];
  educations: ParsedEducation[];
  projects: ParsedProject[];
  skills: string[];
  certifications: ParsedCertification[];
  achievements: ParsedAchievement[];
}
