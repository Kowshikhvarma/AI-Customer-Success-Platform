/**
 * Offline ATS match analyzer.
 *
 * Works with no API key, so the app is fully usable as a demo, and is used as
 * a fallback if the Gemini call fails. Transparent rules:
 *   - Keywords (50%): which skills/tools named in the JD appear in the resume
 *   - Formatting (20%): standard sections, contact details, bullets, length
 *   - Experience (30%): years of experience vs. JD requirement, quantified results, action verbs
 */
import { AtsResult } from '../types';

// Skills and tools commonly found in job descriptions. Multi-word terms are matched as phrases.
export const SKILL_DICTIONARY = [
  // Customer success & business
  'customer success', 'customer onboarding', 'onboarding', 'retention', 'churn', 'renewals', 'upsell',
  'account management', 'stakeholder management', 'customer lifecycle', 'nps', 'csat', 'qbr', 'sla',
  'escalation management', 'customer journey', 'health score', 'saas', 'b2b', 'crm', 'salesforce',
  'hubspot', 'zendesk', 'gainsight', 'intercom', 'freshdesk', 'project management', 'agile', 'scrum',
  'jira', 'confluence', 'kpi', 'okr', 'data analysis', 'reporting', 'dashboards', 'process improvement',
  'communication', 'presentation', 'negotiation', 'training',
  // Data & analytics
  'sql', 'mysql', 'postgresql', 'excel', 'google sheets', 'tableau', 'power bi', 'looker', 'python',
  'pandas', 'statistics', 'a/b testing', 'machine learning',
  // Engineering
  'javascript', 'typescript', 'react', 'node.js', 'html', 'css', 'java', 'c++', 'go', 'rest api', 'api',
  'graphql', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'ci/cd', 'linux', 'microservices',
  // AI & automation
  'openai', 'llm', 'prompt engineering', 'generative ai', 'n8n', 'zapier', 'workflow automation',
  'automation', 'gemini', 'langchain',
] as const;

const ACTION_VERBS = [
  'led', 'managed', 'built', 'designed', 'developed', 'launched', 'improved', 'reduced', 'increased',
  'automated', 'delivered', 'implemented', 'drove', 'owned', 'created', 'optimized', 'achieved', 'mentored',
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const containsTerm = (text: string, term: string): boolean =>
  new RegExp(`(^|[^a-z0-9+#])${escape(term)}($|[^a-z0-9+#])`, 'i').test(text);

export const extractKeywords = (text: string): string[] => {
  const found = SKILL_DICTIONARY.filter(term => containsTerm(text, term));
  // Drop generic terms already covered by a longer phrase (e.g. "onboarding" when "customer onboarding" is present)
  return found.filter(t => !found.some(other => other !== t && other.includes(t) && containsTerm(text, other)));
};

/** "3+ years", "minimum 5 years", "2-4 years" -> smallest number mentioned. */
export const requiredYears = (jd: string): number | null => {
  const matches = [...jd.matchAll(/(\d{1,2})\s*(?:\+|-\s*\d{1,2})?\s*(?:years|yrs)/gi)].map(m => Number(m[1]));
  return matches.length ? Math.min(...matches) : null;
};

/** Sum of date ranges like "Aug 2025 - Present" or "2021 - 2023", plus explicit "X years of experience". */
export const resumeYears = (resume: string, now = new Date()): number => {
  const explicit = [...resume.matchAll(/(\d{1,2})\+?\s*years?\s+of\s+experience/gi)].map(m => Number(m[1]));
  if (explicit.length) return Math.max(...explicit);

  // Only count date ranges in the Experience section, so education dates aren't counted as work.
  const section = experienceSection(resume);
  const month = '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?\\s*';
  const range = new RegExp(`(${month})?(\\d{4})\\s*[-–to]+\\s*(${month})?(\\d{4}|present|current|now)`, 'gi');
  let months = 0;
  for (const m of section.matchAll(range)) {
    const startMonth = m[1] ? monthIndex(m[1]) : 0;
    const startYear = Number(m[2]);
    const isOpen = /present|current|now/i.test(m[4]);
    const endYear = isOpen ? now.getFullYear() : Number(m[4]);
    const endMonth = isOpen ? now.getMonth() : m[3] ? monthIndex(m[3]) : 11;
    const span = (endYear - startYear) * 12 + (endMonth - startMonth);
    if (span > 0 && span < 600) months += span;
  }
  return Math.round((months / 12) * 10) / 10;
};

const HEADINGS = /^\s*(education|skills|projects|certifications|summary|profile|awards|languages)\b.*$/im;

/** Text under an "Experience" heading up to the next section heading (whole resume if no heading). */
export const experienceSection = (resume: string): string => {
  const start = resume.search(/^\s*(work\s+|professional\s+)?experience\b.*$/im);
  if (start === -1) return resume;
  const rest = resume.slice(start).split('\n');
  const end = rest.slice(1).findIndex(line => HEADINGS.test(line));
  return (end === -1 ? rest : rest.slice(0, end + 1)).join('\n');
};

const monthIndex = (m: string) =>
  ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(m.trim().slice(0, 3).toLowerCase());

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const analyzeOffline = (resume: string, jd: string): AtsResult => {
  const resumeLower = resume.toLowerCase();

  // ---- Keywords
  const jdKeywords = extractKeywords(jd);
  const matched = jdKeywords.filter(k => containsTerm(resumeLower, k));
  const missing = jdKeywords.filter(k => !matched.includes(k));
  const keywordScore = jdKeywords.length ? clamp((100 * matched.length) / jdKeywords.length) : 50;

  // ---- Formatting
  const sections = ['experience', 'education', 'skills', 'projects', 'summary'];
  const sectionHits = sections.filter(s => resumeLower.includes(s)).length;
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.]+/.test(resume);
  const hasPhone = /(\+?\d[\d\s-]{8,}\d)/.test(resume);
  const bulletLines = resume.split('\n').filter(l => /^\s*([-•*▪●]|\d+\.)\s+/.test(l)).length;
  const words = resume.split(/\s+/).filter(Boolean).length;
  const lengthOk = words >= 250 && words <= 1000;
  const formattingScore = clamp(
    (sectionHits / sections.length) * 45 + (hasEmail ? 15 : 0) + (hasPhone ? 10 : 0) +
    Math.min(bulletLines, 6) * 3 + (lengthOk ? 12 : 4),
  );

  // ---- Experience
  const need = requiredYears(jd);
  const have = resumeYears(resume);
  const yearsScore = need === null ? 70 : have >= need ? 100 : (have / need) * 100;
  const quantified = (resume.match(/\d+\s*%|\d+\+|₹|\$|\b\d{2,}\b/g) || []).length;
  const verbs = ACTION_VERBS.filter(v => new RegExp(`\\b${v}\\b`, 'i').test(resume)).length;
  const experienceScore = clamp(yearsScore * 0.6 + Math.min(quantified, 8) * 3 + Math.min(verbs, 8) * 2);

  const overallScore = clamp(keywordScore * 0.5 + formattingScore * 0.2 + experienceScore * 0.3);

  // ---- Feedback & CSM action items
  const notes: string[] = [];
  notes.push(
    jdKeywords.length
      ? `The resume covers ${matched.length} of ${jdKeywords.length} key skills in the job description.`
      : 'Few recognisable skills were found in the job description; paste the full JD for a better match.',
  );
  if (missing.length) notes.push(`Add evidence for: ${missing.slice(0, 6).join(', ')}.`);
  if (need !== null)
    notes.push(have >= need
      ? `Experience (~${have} yrs) meets the ${need}+ years asked for.`
      : `The role asks for ${need}+ years; the resume shows about ${have}. Highlight internships, projects and transferable work.`);
  if (quantified < 4) notes.push('Add measurable results (%, counts, time saved) to more bullet points.');
  if (sectionHits < 3) notes.push('Use clear section headings (Summary, Experience, Skills, Education) so ATS can parse it.');

  const tasks: string[] = [];
  if (missing.length) tasks.push(`Add missing keywords to resume: ${missing.slice(0, 4).join(', ')}`);
  if (quantified < 4) tasks.push('Rewrite experience bullets with quantified outcomes');
  if (sectionHits < 3 || bulletLines < 4) tasks.push('Reformat resume into ATS-friendly sections and bullets');
  if (need !== null && have < need) tasks.push('Highlight projects/internships to close the experience gap');
  tasks.push('Re-run ATS check after edits and share updated score with client');

  return {
    keywordScore,
    formattingScore,
    experienceScore,
    overallScore,
    feedback: notes.join(' '),
    missingKeywords: missing,
    matchedKeywords: matched,
    suggestedTasks: tasks.slice(0, 5),
    engine: 'offline',
  };
};
