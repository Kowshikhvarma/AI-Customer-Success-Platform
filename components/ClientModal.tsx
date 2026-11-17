import React, { useEffect, useState } from 'react';
import { formatShort, newId, today } from '../lib/dates';
import { isOverdue } from '../lib/metrics';
import { AtsRecord, Client, OnboardingStatus, PlanType, Task, TaskStatus } from '../types';
import { scoreColor, statusColor } from './ClientList';

export type ModalMode = 'add' | 'edit' | 'view';

interface ClientModalProps {
  isOpen: boolean;
  mode: ModalMode;
  client?: Client;
  tasks: Task[];
  atsRecords: AtsRecord[];
  onClose: () => void;
  onSave: (client: Client) => void;
  onEdit: (client: Client) => void;
  onRunAnalysis: (clientId: string) => void;
}

const EMPTY = { name: '', email: '', phone: '', targetRole: '', planType: 'Basic' as PlanType, status: OnboardingStatus.PENDING };

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, mode, client, tasks, atsRecords, onClose, onSave, onEdit, onRunAnalysis }) => {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setForm(client && mode !== 'add'
      ? { name: client.name, email: client.email, phone: client.phone, targetRole: client.targetRole ?? '', planType: client.planType, status: client.status }
      : EMPTY);
  }, [client, mode, isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: client?.id ?? newId('c'),
      ...form,
      name: form.name.trim(),
      targetRole: form.targetRole.trim() || undefined,
      createdAt: client?.createdAt ?? today(),
    });
  };

  const input = 'w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';
  const label = 'text-xs font-bold text-slate-500 uppercase tracking-wider';

  // ---------- Profile view
  if (mode === 'view' && client) {
    const clientTasks = tasks.filter(t => t.clientId === client.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const history = atsRecords.filter(r => r.clientId === client.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const latestScore = history[history.length - 1]?.overallScore;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
        <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b border-slate-100 flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{client.name}</h3>
              <p className="text-sm text-slate-500">{client.targetRole ?? 'Target role not set'} · {client.planType} plan</p>
              <p className="text-xs text-slate-400 mt-1">{client.email} · {client.phone} · joined {formatShort(client.createdAt)}</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
          </div>

          <div className="p-6 grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50">
              <p className={label}>Status</p>
              <span className={`inline-block mt-2 text-xs font-bold px-2 py-1 rounded-full ${statusColor(client.status)}`}>{client.status}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <p className={label}>Latest ATS</p>
              <p className={`text-2xl font-bold mt-1 ${latestScore !== undefined ? scoreColor(latestScore) : 'text-slate-300'}`}>{latestScore !== undefined ? `${latestScore}%` : '–'}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <p className={label}>Open tasks</p>
              <p className="text-2xl font-bold mt-1 text-slate-800">{clientTasks.filter(t => t.status !== TaskStatus.DONE).length}</p>
            </div>
          </div>

          <div className="px-6 pb-2">
            <h4 className="font-bold text-slate-800 text-sm mb-2">ATS history</h4>
            {history.length ? (
              <div className="flex flex-wrap gap-2">
                {history.map((r, i) => (
                  <span key={r.id} className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                    {i > 0 && '→ '}<b className={scoreColor(r.overallScore)}>{r.overallScore}%</b>
                    <span className="text-slate-400"> · {formatShort(r.createdAt.slice(0, 10))}</span>
                  </span>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">No analyses yet.</p>}
          </div>

          <div className="px-6 py-4">
            <h4 className="font-bold text-slate-800 text-sm mb-2">Tasks</h4>
            <ul className="divide-y divide-slate-100">
              {clientTasks.map(t => (
                <li key={t.id} className="py-2 flex justify-between text-sm">
                  <span className={t.status === TaskStatus.DONE ? 'line-through text-slate-400' : 'text-slate-700'}>{t.title}</span>
                  <span className={`text-xs ${isOverdue(t) ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>
                    {t.status} · {t.assignedTo} · {formatShort(t.dueDate)}
                  </span>
                </li>
              ))}
              {!clientTasks.length && <li className="py-2 text-sm text-slate-400">No tasks yet.</li>}
            </ul>
          </div>

          <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
            <button onClick={() => onEdit(client)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Edit client</button>
            <button onClick={() => onRunAnalysis(client.id)} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">Run ATS analysis</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Add / edit form
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">{mode === 'add' ? 'Add New Client' : 'Edit Client'}</h3>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className={label}>Full name</label>
            <input required className={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Priya Sharma" />
          </div>
          <div className="space-y-1">
            <label className={label}>Email</label>
            <input required type="email" className={input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={label}>Phone</label>
              <input required type="tel" className={input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-1">
              <label className={label}>Plan</label>
              <select className={input} value={form.planType} onChange={e => setForm({ ...form, planType: e.target.value as PlanType })}>
                <option>Basic</option><option>Premium</option><option>Enterprise</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className={label}>Target role</label>
            <input className={input} value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })} placeholder="e.g. Data Analyst" />
          </div>
          {mode === 'edit' && (
            <div className="space-y-1">
              <label className={label}>Onboarding status</label>
              <select className={input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as OnboardingStatus })}>
                {Object.values(OnboardingStatus).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">{mode === 'add' ? 'Create client' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;
