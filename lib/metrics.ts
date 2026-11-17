/**
 * Dashboard KPIs, all calculated from the app's own data (no hard-coded numbers).
 */
import { AtsRecord, Client, OnboardingStatus, PlanType, Task, TaskStatus } from '../types';
import { addDays, today as todayFn } from './dates';

export const isOverdue = (task: Task, today = todayFn()): boolean =>
  task.status !== TaskStatus.DONE && task.dueDate < today;

/** Latest ATS record per client. */
export const latestAtsByClient = (records: AtsRecord[]): Map<string, AtsRecord> => {
  const latest = new Map<string, AtsRecord>();
  for (const r of records) {
    const current = latest.get(r.clientId);
    if (!current || r.createdAt > current.createdAt) latest.set(r.clientId, r);
  }
  return latest;
};

/** First and latest score per client: shows how much a client's resume improved. */
export const atsImprovement = (records: AtsRecord[]): { clientId: string; first: number; latest: number }[] => {
  const byClient = new Map<string, AtsRecord[]>();
  records.forEach(r => byClient.set(r.clientId, [...(byClient.get(r.clientId) ?? []), r]));
  return [...byClient.entries()]
    .filter(([, rs]) => rs.length >= 2)
    .map(([clientId, rs]) => {
      const sorted = [...rs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return { clientId, first: sorted[0].overallScore, latest: sorted[sorted.length - 1].overallScore };
    });
};

export interface DashboardMetrics {
  totalClients: number;
  byStatus: Record<OnboardingStatus, number>;
  byPlan: Record<PlanType, number>;
  openTasks: number;
  overdueTasks: number;
  dueThisWeek: number;
  onTimeRate: number | null; // % of completed tasks finished by their due date
  avgAtsScore: number | null; // average of each client's latest score
  avgAtsGain: number | null; // avg points gained between first and latest analysis
  clientsNeedingAttention: { client: Client; reasons: string[] }[];
  workload: { assignee: string; open: number; overdue: number }[];
}

export const computeMetrics = (
  clients: Client[],
  tasks: Task[],
  atsRecords: AtsRecord[],
  today = todayFn(),
): DashboardMetrics => {
  const byStatus = {
    [OnboardingStatus.PENDING]: 0,
    [OnboardingStatus.IN_PROGRESS]: 0,
    [OnboardingStatus.COMPLETED]: 0,
  } as Record<OnboardingStatus, number>;
  const byPlan: Record<PlanType, number> = { Basic: 0, Premium: 0, Enterprise: 0 };
  clients.forEach(c => {
    byStatus[c.status] += 1;
    byPlan[c.planType] += 1;
  });

  const open = tasks.filter(t => t.status !== TaskStatus.DONE);
  const done = tasks.filter(t => t.status === TaskStatus.DONE && t.completedAt);
  const weekEnd = addDays(today, 7);

  const latest = latestAtsByClient(atsRecords);
  const latestScores = [...latest.values()].map(r => r.overallScore);
  const gains = atsImprovement(atsRecords).map(g => g.latest - g.first);

  const clientsNeedingAttention = clients
    .filter(c => c.status !== OnboardingStatus.COMPLETED)
    .map(client => {
      const reasons: string[] = [];
      const overdue = open.filter(t => t.clientId === client.id && isOverdue(t, today)).length;
      if (overdue) reasons.push(`${overdue} overdue task${overdue > 1 ? 's' : ''}`);
      const score = latest.get(client.id)?.overallScore;
      if (score === undefined) reasons.push('No ATS analysis yet');
      else if (score < 60) reasons.push(`Low ATS score (${score}%)`);
      return { client, reasons };
    })
    .filter(x => x.reasons.length > 0)
    .sort((a, b) => b.reasons.length - a.reasons.length);

  const workloadMap = new Map<string, { open: number; overdue: number }>();
  open.forEach(t => {
    const w = workloadMap.get(t.assignedTo) ?? { open: 0, overdue: 0 };
    w.open += 1;
    if (isOverdue(t, today)) w.overdue += 1;
    workloadMap.set(t.assignedTo, w);
  });

  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

  return {
    totalClients: clients.length,
    byStatus,
    byPlan,
    openTasks: open.length,
    overdueTasks: open.filter(t => isOverdue(t, today)).length,
    dueThisWeek: open.filter(t => t.dueDate >= today && t.dueDate <= weekEnd).length,
    onTimeRate: done.length
      ? Math.round((100 * done.filter(t => (t.completedAt as string) <= t.dueDate).length) / done.length)
      : null,
    avgAtsScore: avg(latestScores),
    avgAtsGain: avg(gains),
    clientsNeedingAttention,
    workload: [...workloadMap.entries()]
      .map(([assignee, w]) => ({ assignee, ...w }))
      .sort((a, b) => b.open - a.open),
  };
};
