import { describe, expect, it } from 'vitest';
import { buildSeedData } from '../constants';
import { analyzeOffline, extractKeywords, requiredYears, resumeYears } from '../lib/atsAnalyzer';
import { addDays, daysBetween } from '../lib/dates';
import { atsImprovement, computeMetrics, isOverdue, latestAtsByClient } from '../lib/metrics';
import { actions, loadData, saveData } from '../lib/store';
import { OnboardingStatus, TaskStatus } from '../types';

const TODAY = '2026-11-18';

const JD = `Customer Success Manager. 3+ years in B2B SaaS. Own onboarding, retention and renewals.
Track NPS and churn, run QBRs. Experience with Salesforce or HubSpot CRM, SQL and Jira. Automation with n8n is a plus.`;

const STRONG = `Summary
Customer Success Manager with 4 years of experience in B2B SaaS.
Experience
- Managed onboarding and retention for 120+ accounts, improving renewals by 18%
- Reduced churn 12% by tracking NPS and running QBRs
- Automated workflows with n8n; built SQL dashboards in Jira and HubSpot CRM
Skills
SQL, Jira, HubSpot, Salesforce, n8n
Education
B.Tech, 2021 - 2025
priya@example.com | +91 98765 43210`;

const WEAK = `I am a hard working person who likes computers. Worked at a shop. Good at Excel.`;

describe('dates', () => {
  it('adds and diffs days across month boundaries', () => {
    expect(addDays('2026-11-28', 5)).toBe('2026-12-03');
    expect(daysBetween('2026-11-28', '2026-12-03')).toBe(5);
  });
});

describe('offline ATS analyzer', () => {
  it('extracts skills from a JD without duplicate sub-phrases', () => {
    const kws = extractKeywords(JD);
    expect(kws).toEqual(expect.arrayContaining(['customer success', 'salesforce', 'sql', 'n8n', 'nps', 'churn']));
    expect(kws).not.toContain('go'); // must not match inside other words
  });

  it('reads experience requirements and resume date ranges', () => {
    expect(requiredYears(JD)).toBe(3);
    expect(resumeYears('Analyst, Jan 2022 - Dec 2023')).toBeCloseTo(1.9, 1);
    expect(resumeYears('Customer Success Manager with 4 years of experience')).toBe(4);
  });

  it('scores a strong resume well above a weak one', () => {
    const strong = analyzeOffline(STRONG, JD);
    const weak = analyzeOffline(WEAK, JD);
    expect(strong.overallScore).toBeGreaterThan(70);
    expect(weak.overallScore).toBeLessThan(35);
    expect(strong.engine).toBe('offline');
    for (const r of [strong, weak]) {
      for (const s of [r.keywordScore, r.formattingScore, r.experienceScore, r.overallScore]) {
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(100);
      }
    }
  });

  it('lists missing keywords and turns them into CSM tasks', () => {
    const weak = analyzeOffline(WEAK, JD);
    expect(weak.missingKeywords).toContain('salesforce');
    expect(weak.suggestedTasks[0]).toMatch(/Add missing keywords/);
    expect(weak.suggestedTasks.length).toBeLessThanOrEqual(5);
  });
});

describe('metrics', () => {
  const seed = buildSeedData(TODAY);

  it('counts open, overdue and on-time tasks from real data', () => {
    const m = computeMetrics(seed.clients, seed.tasks, seed.atsRecords, TODAY);
    expect(m.totalClients).toBe(6);
    expect(m.openTasks).toBe(seed.tasks.filter(t => t.status !== TaskStatus.DONE).length);
    expect(m.overdueTasks).toBe(3);
    expect(m.onTimeRate).toBe(80); // 4 of 5 completed tasks finished by due date
    expect(m.byStatus[OnboardingStatus.COMPLETED]).toBe(2);
  });

  it('uses each client latest ATS score and tracks improvement', () => {
    const latest = latestAtsByClient(seed.atsRecords);
    expect(latest.get('c1')?.overallScore).toBe(66);
    const gains = atsImprovement(seed.atsRecords);
    expect(gains.find(g => g.clientId === 'c3')).toEqual({ clientId: 'c3', first: 61, latest: 84 });
    const m = computeMetrics(seed.clients, seed.tasks, seed.atsRecords, TODAY);
    expect(m.avgAtsScore).toBe(Math.round((66 + 55 + 84 + 58 + 79) / 5));
  });

  it('flags clients that need attention', () => {
    const m = computeMetrics(seed.clients, seed.tasks, seed.atsRecords, TODAY);
    const names = m.clientsNeedingAttention.map(x => x.client.name);
    expect(names).toContain('Rohit Verma'); // overdue kickoff + no ATS analysis yet
    expect(names).not.toContain('Sneha Reddy'); // completed clients are excluded
  });

  it('treats done tasks as never overdue', () => {
    expect(isOverdue({ ...seed.tasks[0], status: TaskStatus.DONE, dueDate: '2000-01-01' }, TODAY)).toBe(false);
  });
});

describe('store actions', () => {
  const seed = buildSeedData(TODAY);

  it('moves tasks and stamps completion date', () => {
    const done = actions.moveTask(seed, 't3', TaskStatus.DONE, TODAY);
    expect(done.tasks.find(t => t.id === 't3')).toMatchObject({ status: TaskStatus.DONE, completedAt: TODAY });
    const reopened = actions.moveTask(done, 't3', TaskStatus.TODO, TODAY);
    expect(reopened.tasks.find(t => t.id === 't3')?.completedAt).toBeUndefined();
  });

  it('deleting a client removes its tasks and ATS history', () => {
    const next = actions.deleteClient(seed, 'c1');
    expect(next.clients.find(c => c.id === 'c1')).toBeUndefined();
    expect(next.tasks.some(t => t.clientId === 'c1')).toBe(false);
    expect(next.atsRecords.some(r => r.clientId === 'c1')).toBe(false);
  });

  it('records an ATS result against a client', () => {
    const next = actions.recordAts(seed, 'c4', analyzeOffline(STRONG, JD));
    expect(next.atsRecords.filter(r => r.clientId === 'c4')).toHaveLength(1);
  });

  it('persists and reloads data, and survives corrupted storage', () => {
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    const changed = actions.deleteTask(seed, 't1');
    saveData(changed, storage);
    expect(loadData(storage).tasks).toHaveLength(seed.tasks.length - 1);
    mem.set('successpath-ai:v1', '{not json');
    expect(loadData(storage).clients.length).toBeGreaterThan(0);
  });
});

describe('experience section parsing', () => {
  it('ignores education date ranges when counting experience', () => {
    const resume = `Experience
Support Associate, Jan 2023 - Dec 2023
Education
B.Com, 2015 - 2022
Skills
Excel`;
    expect(resumeYears(resume)).toBeCloseTo(0.9, 1);
  });
});
