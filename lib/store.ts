/**
 * App state with localStorage persistence, so data survives page reloads.
 */
import { useCallback, useEffect, useState } from 'react';
import { buildSeedData } from '../constants';
import { AtsRecord, AtsResult, Client, Task, TaskStatus } from '../types';
import { newId, today } from './dates';

const STORAGE_KEY = 'successpath-ai:v1';

export interface AppData {
  clients: Client[];
  tasks: Task[];
  atsRecords: AtsRecord[];
}

/** Read saved data; fall back to demo data if nothing is saved or storage is unavailable. */
export const loadData = (storage: Pick<Storage, 'getItem'> | undefined = safeStorage()): AppData => {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (Array.isArray(parsed.clients) && Array.isArray(parsed.tasks)) {
        return { ...parsed, atsRecords: parsed.atsRecords ?? [] };
      }
    }
  } catch {
    /* corrupted or blocked storage: use demo data */
  }
  return buildSeedData();
};

export const saveData = (data: AppData, storage: Pick<Storage, 'setItem'> | undefined = safeStorage()) => {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage full or blocked: keep working in memory */
  }
};

function safeStorage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

/** Pure state transitions (easy to unit test). */
export const actions = {
  upsertClient: (data: AppData, client: Client): AppData => ({
    ...data,
    clients: data.clients.some(c => c.id === client.id)
      ? data.clients.map(c => (c.id === client.id ? client : c))
      : [client, ...data.clients],
  }),

  deleteClient: (data: AppData, clientId: string): AppData => ({
    clients: data.clients.filter(c => c.id !== clientId),
    tasks: data.tasks.filter(t => t.clientId !== clientId),
    atsRecords: data.atsRecords.filter(r => r.clientId !== clientId),
  }),

  addTask: (data: AppData, task: Omit<Task, 'id' | 'status'> & { status?: TaskStatus }): AppData => ({
    ...data,
    tasks: [...data.tasks, { ...task, id: newId('t'), status: task.status ?? TaskStatus.TODO }],
  }),

  moveTask: (data: AppData, taskId: string, status: TaskStatus, on = today()): AppData => ({
    ...data,
    tasks: data.tasks.map(t =>
      t.id === taskId
        ? { ...t, status, completedAt: status === TaskStatus.DONE ? (t.completedAt ?? on) : undefined }
        : t,
    ),
  }),

  deleteTask: (data: AppData, taskId: string): AppData => ({
    ...data,
    tasks: data.tasks.filter(t => t.id !== taskId),
  }),

  recordAts: (data: AppData, clientId: string, result: AtsResult): AppData => ({
    ...data,
    atsRecords: [
      ...data.atsRecords,
      {
        id: newId('a'),
        clientId,
        overallScore: result.overallScore,
        keywordScore: result.keywordScore,
        missingKeywords: result.missingKeywords,
        engine: result.engine,
        createdAt: new Date().toISOString(),
      },
    ],
  }),
};

type Actions = typeof actions;
type BoundActions = {
  [K in keyof Actions]: Actions[K] extends (data: AppData, ...args: infer A) => AppData ? (...args: A) => void : never;
};

export const useAppStore = (): AppData & BoundActions & { resetDemo: () => void } => {
  const [data, setData] = useState<AppData>(() => loadData());

  useEffect(() => saveData(data), [data]);

  const bind = useCallback(
    <A extends unknown[]>(fn: (d: AppData, ...args: A) => AppData) =>
      (...args: A) => setData(prev => fn(prev, ...args)),
    [],
  );

  return {
    ...data,
    upsertClient: bind(actions.upsertClient),
    deleteClient: bind(actions.deleteClient),
    addTask: bind(actions.addTask),
    moveTask: bind(actions.moveTask),
    deleteTask: bind(actions.deleteTask),
    recordAts: bind(actions.recordAts),
    resetDemo: () => setData(buildSeedData()),
  };
};
