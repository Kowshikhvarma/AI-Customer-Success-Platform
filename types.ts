
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

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  planType: 'Basic' | 'Premium' | 'Enterprise';
  status: OnboardingStatus;
  createdAt: string;
}

export interface Resume {
  id: string;
  clientId: string;
  fileName: string;
  parsedText?: string;
  atsScore?: number;
  uploadedAt: string;
}

export interface ResumeAnalysis {
  id: string;
  resumeId: string;
  keywordScore: number;
  formattingScore: number;
  experienceScore: number;
  overallScore: number;
  feedback: string;
  suggestedTasks: string[];
}

export interface Task {
  id: string;
  clientId: string;
  title: string;
  type: string;
  status: TaskStatus;
  assignedTo: string;
  dueDate: string;
}

export interface Delivery {
  id: string;
  clientId: string;
  version: string;
  status: 'Ready' | 'Delivered' | 'Revision';
  deliveredAt?: string;
}
