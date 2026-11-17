import React, { useMemo, useState } from 'react';
import { isOverdue, latestAtsByClient } from '../lib/metrics';
import { formatShort } from '../lib/dates';
import { AtsRecord, Client, OnboardingStatus, PlanType, Task, TaskStatus } from '../types';

interface ClientListProps {
  clients: Client[];
  tasks: Task[];
  atsRecords: AtsRecord[];
  onEdit: (client: Client) => void;
  onView: (client: Client) => void;
  onDelete: (clientId: string) => void;
}

export const statusColor = (status: OnboardingStatus) =>
  ({
    [OnboardingStatus.COMPLETED]: 'bg-green-100 text-green-700',
    [OnboardingStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-700',
    [OnboardingStatus.PENDING]: 'bg-slate-100 text-slate-700',
  })[status];

export const scoreColor = (score: number) =>
  score >= 75 ? 'text-green-600' : score >= 60 ? 'text-blue-600' : 'text-orange-600';

const ClientList: React.FC<ClientListProps> = ({ clients, tasks, atsRecords, onEdit, onView, onDelete }) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<OnboardingStatus | ''>('');
  const [plan, setPlan] = useState<PlanType | ''>('');

  const latest = useMemo(() => latestAtsByClient(atsRecords), [atsRecords]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter(c =>
      (!q || [c.name, c.email, c.targetRole ?? ''].some(v => v.toLowerCase().includes(q))) &&
      (!status || c.status === status) &&
      (!plan || c.planType === plan),
    );
  }, [clients, query, status, plan]);

  const selectCls = 'text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Manage Clients</h3>
          <p className="text-xs text-slate-500">{filtered.length} of {clients.length} clients</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search name, email or role…"
            className="text-sm border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
          <select value={status} onChange={e => setStatus(e.target.value as OnboardingStatus | '')} className={selectCls}>
            <option value="">All statuses</option>
            {Object.values(OnboardingStatus).map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={plan} onChange={e => setPlan(e.target.value as PlanType | '')} className={selectCls}>
            <option value="">All plans</option>
            {(['Basic', 'Premium', 'Enterprise'] as PlanType[]).map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Plan</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Latest ATS</th>
              <th className="px-6 py-3">Open tasks</th>
              <th className="px-6 py-3">Joined</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(client => {
              const open = tasks.filter(t => t.clientId === client.id && t.status !== TaskStatus.DONE);
              const overdue = open.filter(t => isOverdue(t)).length;
              const ats = latest.get(client.id);
              return (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <button onClick={() => onView(client)} className="flex items-center gap-3 text-left">
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-xs">
                        {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm hover:text-blue-600">{client.name}</p>
                        <p className="text-xs text-slate-400">{client.targetRole || client.email}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600">{client.planType}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${statusColor(client.status)}`}>{client.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    {ats ? <span className={`font-bold text-sm ${scoreColor(ats.overallScore)}`}>{ats.overallScore}%</span>
                         : <span className="text-xs text-slate-400">Not analysed</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {open.length}
                    {overdue > 0 && <span className="ml-2 text-[11px] font-semibold text-red-600">{overdue} overdue</span>}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{formatShort(client.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => onView(client)} className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded text-xs font-bold">View</button>
                      <button onClick={() => onEdit(client)} className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-bold">Edit</button>
                      <button
                        onClick={() => confirm(`Delete ${client.name} and all their tasks?`) && onDelete(client.id)}
                        className="px-2 py-1 text-red-500 hover:bg-red-50 rounded text-xs font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-400">No clients match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientList;
