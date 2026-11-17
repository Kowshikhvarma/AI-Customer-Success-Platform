import { AtsRecord, Client, OnboardingStatus, Task, TaskStatus } from './types';
import { addDays, today } from './lib/dates';

export const TEAM = ['Kowshikh', 'Ananya', 'Rahul', 'Sneha'];
export const TASK_TYPES = ['Review', 'Editing', 'Onboarding', 'Delivery', 'Follow-up'];

/**
 * Fictional demo workspace. Dates are relative to today so overdue and
 * due-this-week metrics always look realistic.
 */
export const buildSeedData = (base = today()) => {
  const d = (offset: number) => addDays(base, offset);
  const ts = (offset: number, hour = 10) => `${d(offset)}T${String(hour).padStart(2, '0')}:00:00.000Z`;

  const clients: Client[] = [
    { id: 'c1', name: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '+91 98765 43210', planType: 'Premium', status: OnboardingStatus.IN_PROGRESS, targetRole: 'Data Analyst', createdAt: d(-21) },
    { id: 'c2', name: 'Arjun Mehta', email: 'arjun.mehta@example.com', phone: '+91 91234 56780', planType: 'Enterprise', status: OnboardingStatus.IN_PROGRESS, targetRole: 'Customer Success Manager', createdAt: d(-14) },
    { id: 'c3', name: 'Sneha Reddy', email: 'sneha.reddy@example.com', phone: '+91 99887 76655', planType: 'Basic', status: OnboardingStatus.COMPLETED, targetRole: 'Frontend Developer', createdAt: d(-40) },
    { id: 'c4', name: 'Rohit Verma', email: 'rohit.verma@example.com', phone: '+91 90000 11122', planType: 'Premium', status: OnboardingStatus.PENDING, targetRole: 'Product Manager', createdAt: d(-3) },
    { id: 'c5', name: 'Kavya Nair', email: 'kavya.nair@example.com', phone: '+91 98450 12345', planType: 'Enterprise', status: OnboardingStatus.IN_PROGRESS, targetRole: 'Business Analyst', createdAt: d(-10) },
    { id: 'c6', name: 'Vikram Singh', email: 'vikram.singh@example.com', phone: '+91 97000 22233', planType: 'Basic', status: OnboardingStatus.COMPLETED, targetRole: 'QA Engineer', createdAt: d(-35) },
  ];

  const task = (id: string, clientId: string, title: string, type: string, status: TaskStatus,
    assignedTo: string, due: number, completed?: number): Task => ({
    id, clientId, title, type, status, assignedTo, dueDate: d(due),
    ...(completed !== undefined ? { completedAt: d(completed) } : {}),
  });

  const tasks: Task[] = [
    task('t1', 'c1', 'Kickoff call and collect current resume', 'Onboarding', TaskStatus.DONE, 'Kowshikh', -18, -19),
    task('t2', 'c1', 'Add SQL and Power BI keywords to resume', 'Editing', TaskStatus.IN_PROGRESS, 'Ananya', -2),
    task('t3', 'c1', 'Share ATS-optimized resume v2', 'Delivery', TaskStatus.TODO, 'Ananya', 3),
    task('t4', 'c2', 'Kickoff call and success criteria', 'Onboarding', TaskStatus.DONE, 'Kowshikh', -12, -12),
    task('t5', 'c2', 'Rewrite bullets with retention metrics', 'Editing', TaskStatus.IN_PROGRESS, 'Rahul', 2),
    task('t6', 'c2', 'Weekly progress update to client', 'Follow-up', TaskStatus.TODO, 'Kowshikh', 5),
    task('t7', 'c3', 'Final resume delivery', 'Delivery', TaskStatus.DONE, 'Sneha', -30, -28),
    task('t8', 'c4', 'Schedule kickoff call', 'Onboarding', TaskStatus.TODO, 'Kowshikh', -1),
    task('t9', 'c5', 'Review resume against BA job descriptions', 'Review', TaskStatus.DONE, 'Rahul', -6, -6),
    task('t10', 'c5', 'Add stakeholder management examples', 'Editing', TaskStatus.TODO, 'Rahul', -3),
    task('t11', 'c5', 'Client feedback call', 'Follow-up', TaskStatus.TODO, 'Kowshikh', 6),
    task('t12', 'c6', 'Final resume delivery', 'Delivery', TaskStatus.DONE, 'Sneha', -25, -26),
  ];

  const rec = (id: string, clientId: string, overallScore: number, keywordScore: number,
    missingKeywords: string[], dayOffset: number): AtsRecord => ({
    id, clientId, overallScore, keywordScore, missingKeywords, engine: 'offline', createdAt: ts(dayOffset),
  });

  const atsRecords: AtsRecord[] = [
    rec('a1', 'c1', 48, 40, ['power bi', 'tableau', 'statistics'], -18),
    rec('a2', 'c1', 66, 62, ['tableau'], -4),
    rec('a3', 'c2', 55, 50, ['churn', 'nps', 'gainsight'], -11),
    rec('a4', 'c3', 61, 58, ['typescript'], -38),
    rec('a5', 'c3', 84, 85, [], -29),
    rec('a6', 'c5', 58, 52, ['stakeholder management', 'jira'], -7),
    rec('a7', 'c6', 52, 45, ['ci/cd', 'docker'], -33),
    rec('a8', 'c6', 79, 80, [], -26),
  ];

  return { clients, tasks, atsRecords };
};
