export enum OnboardingStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed'
}

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done'
}

export type PlanType = 'Basic' | 'Premium' | 'Enterprise';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  planType: PlanType;
  status: OnboardingStatus;
  targetRole?: string;
  createdAt: string; // YYYY-MM-DD
}

export interface Task {
  id: string;
  clientId: string;
  title: string;
  type: string;
  status: TaskStatus;
  assignedTo: string;
  dueDate: string; // YYYY-MM-DD
  completedAt?: string; // YYYY-MM-DD
}

/** Result of comparing a resume with a job description. */
export interface AtsResult {
  keywordScore: number;
  formattingScore: number;
  experienceScore: number;
  overallScore: number;
  feedback: string;
  missingKeywords: string[];
  matchedKeywords?: string[];
  suggestedTasks: string[];
  engine: 'gemini' | 'offline';
}

/** An ATS analysis saved against a client, so progress can be tracked over time. */
export interface AtsRecord {
  id: string;
  clientId: string;
  overallScore: number;
  keywordScore: number;
  missingKeywords: string[];
  engine: 'gemini' | 'offline';
  createdAt: string; // ISO timestamp
}
