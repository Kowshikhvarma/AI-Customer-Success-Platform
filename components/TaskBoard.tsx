import React, { useState } from 'react';
import { TASK_TYPES, TEAM } from '../constants';
import { addDays, formatShort, today } from '../lib/dates';
import { isOverdue } from '../lib/metrics';
import { Client, Task, TaskStatus } from '../types';

interface TaskBoardProps {
  tasks: Task[];
  clients: Client[];
  onAdd: (task: Omit<Task, 'id' | 'status'>) => void;
  onMove: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
}

const COLUMNS = [
  { id: TaskStatus.TODO, label: 'To Do', dot: 'bg-slate-400' },
  { id: TaskStatus.IN_PROGRESS, label: 'In Progress', dot: 'bg-blue-500' },
  { id: TaskStatus.DONE, label: 'Completed', dot: 'bg-green-500' },
];
const ORDER = COLUMNS.map(c => c.id);

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, clients, onAdd, onMove, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [clientFilter, setClientFilter] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', clientId: clients[0]?.id ?? '', type: TASK_TYPES[0], assignedTo: TEAM[0], dueDate: addDays(today(), 3) });

  const clientName = (id: string) => clients.find(c => c.id === id)?.name ?? 'Unknown client';
  const visible = tasks.filter(t => !clientFilter || t.clientId === clientFilter);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.clientId) return;
    onAdd({ ...form, title: form.title.trim() });
    setForm(f => ({ ...f, title: '' }));
    setShowForm(false);
  };

  const input = 'text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className={input}>
          <option value="">All clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => setShowForm(s => !s)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-black">
          {showForm ? 'Cancel' : '+ Add task'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-6 gap-3">
          <input required autoFocus placeholder="Task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={`${input} md:col-span-2`} />
          <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} className={input}>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={input}>
            {TASK_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} className={input}>
            {TEAM.map(t => <option key={t}>{t}</option>)}
          </select>
          <div className="flex gap-2">
            <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className={`${input} flex-1`} />
            <button className="bg-blue-600 text-white px-3 rounded-lg text-sm font-semibold">Add</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map(col => {
          const colTasks = visible.filter(t => t.status === col.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
          return (
            <div
              key={col.id}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (dragId) onMove(dragId, col.id); setDragId(null); }}
              className="flex flex-col min-h-[420px] bg-slate-100/60 rounded-2xl p-4 border border-slate-200"
            >
              <div className="flex items-center gap-2 mb-4 px-1">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{col.label}</h4>
                <span className="ml-auto text-[11px] font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200">{colTasks.length}</span>
              </div>
              <div className="space-y-3">
                {colTasks.map(task => {
                  const late = isOverdue(task);
                  const idx = ORDER.indexOf(task.status);
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDragId(task.id)}
                      className={`bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-grab group ${late ? 'border-red-200' : 'border-slate-200'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{task.type}</span>
                        <button onClick={() => onDelete(task.id)} title="Delete task" className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 text-sm">✕</button>
                      </div>
                      <h5 className={`text-sm font-semibold leading-snug ${task.status === TaskStatus.DONE ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</h5>
                      <p className="text-xs text-slate-500 mt-1">{clientName(task.clientId)}</p>
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">{task.assignedTo[0]}</span>
                          <span className={`text-[11px] font-semibold ${late ? 'text-red-600' : 'text-slate-400'}`}>
                            {late ? 'Overdue · ' : 'Due '}{formatShort(task.dueDate)}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {idx > 0 && (
                            <button onClick={() => onMove(task.id, ORDER[idx - 1])} title="Move back" className="w-6 h-6 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs">←</button>
                          )}
                          {idx < ORDER.length - 1 && (
                            <button onClick={() => onMove(task.id, ORDER[idx + 1])} title="Move forward" className="w-6 h-6 rounded border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs">→</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!colTasks.length && <p className="text-xs text-slate-400 text-center py-6">Drop tasks here</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskBoard;
