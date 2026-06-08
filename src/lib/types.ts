export interface BasicInfo {
  name: string; gender: string; birthDate: string;
  phone: string; email: string; wechat: string;
  city: string; workYears: string; highestDegree: string;
  politicalStatus: string; jobStatus: string;
  homepage: string; avatar: string;
}
export interface JobTarget { position: string; city: string; salary: string; }
export interface SelfEvaluation { content: string; }
export interface EducationEntry {
  id: string; school: string; degree: string; major: string;
  startDate: string; endDate: string; gpa: string; description: string;
}
export interface WorkEntry {
  id: string; company: string; position: string;
  startDate: string; endDate: string; isCurrent: boolean;
  bullets: BulletItem[]; description: string;
}
export interface ProjectEntry {
  id: string; name: string; role: string;
  startDate: string; endDate: string;
  bullets: BulletItem[]; link: string;
}
export interface BulletItem { id: string; html: string; }
export interface AwardEntry { id: string; name: string; level: string; date: string; }
export interface SkillData { items: string[]; }
export interface CertEntry { id: string; name: string; issuer: string; date: string; }
export interface LangEntry { id: string; name: string; level: string; score: string; }

export interface ResumeModules {
  basicInfo: BasicInfo;
  jobTarget: JobTarget;
  selfEvaluation: SelfEvaluation;
  education: EducationEntry[];
  workExperience: WorkEntry[];
  internship: WorkEntry[];
  projects: ProjectEntry[];
  campusActivity: ProjectEntry[];
  organization: ProjectEntry[];
  socialPractice: ProjectEntry[];
  awards: AwardEntry[];
  skills: SkillData;
  certificates: CertEntry[];
  languages: LangEntry[];
  competitions: any[];
  overseas: any[];
  research: any[];
  portfolio: any[];
  custom: any[];
}

export interface ResumeData {
  templateId: string;
  themeColor: string;
  fontFamily: string;
  pageMargin: 'compact' | 'normal' | 'loose';
  moduleSpacing: 'compact' | 'normal' | 'loose';
  lineHeight: 'compact' | 'normal' | 'loose';
  compressOnePage: boolean;
  moduleOrder: string[];
  moduleVisibility: Record<string, boolean>;
  modules: ResumeModules;
}

export interface ModuleDef {
  id: string; name: string; icon: string;
  required?: boolean; single?: boolean; multi?: boolean;
  hasAvatar?: boolean; isTextarea?: boolean;
  isSkills?: boolean; hasBullets?: boolean;
  fieldGroups?: { label: string; fields: string[] }[];
  fields: FieldDef[];
}

export interface FieldDef {
  key: string; label: string; type: 'text' | 'select' | 'month' | 'month-end' | 'checkbox' | 'textarea';
  w?: string; opts?: string[]; placeholder?: string;
}

export interface Template {
  id: string; name: string; desc: string; tags: string[];
  layout: 'single' | 'double-sidebar' | 'double-header' | 'creative' | 'academic';
}
