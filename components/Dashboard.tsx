import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { computeMetrics, latestAtsByClient } from '../lib/metrics';
import { AtsRecord, Client, OnboardingStatus, Task } from '../types';

interface DashboardProps {
  clients: Client[];
  tasks: Task[];
  atsRecords: AtsRecord[];
  onOpenClient: (client: Client) => void;
}

const STATUS_COLORS: Record<OnboardingStatus, string> = {
  [OnboardingStatus.PENDING]: '#94a3b8',
  [OnboardingStatus.IN_PROGRESS]: '#3b82f6',
  [OnboardingStatus.COMPLETED]: '#22c55e',
};

const Kpi: React.FC<{ label: string; value: string | number; hint: string; tone?: string }> = ({ label, value, hint, tone = 'text-slate-900' }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
    <p className={`text-3xl font-bold mt-2 ${tone}`}>{value}</p>
    <p className="text-xs text-slate-400 mt-1">{hint}</p>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ clients, tasks, atsRecords, onOpenClient }) => {
  const m = useMemo(() => computeMetrics(clients, tasks, atsRecords), [clients, tasks, atsRecords]);

  const atsChart = useMemo(() => {
    const byClient = new Map<string, AtsRecord[]>();
    atsRecords.forEach(r => byClient.set(r.clientId, [...(byClient.get(r.clientId) ?? []), r]));
    return clients
      .filter(c => byClient.has(c.id))
      .map(c => {
        const rs = [...(byClient.get(c.id) ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        return { name: c.name.split(' ')[0], First: rs[0].overallScore, Latest: rs[rs.length - 1].overallScore };
      });
  }, [clients, atsRecords]);

  const latest = latestAtsByClient(atsRecords);
  const pct = (n: number) => (m.totalClients ? Math.round((100 * n) / m.totalClients) : 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi label="Active clients" value={m.totalClients - m.byStatus[OnboardingStatus.COMPLETED]} hint={`${m.totalClients} total`} />
        <Kpi label="Avg ATS score" value={m.avgAtsScore === null ? '–' : `${m.avgAtsScore}%`} hint="latest score per client" tone="text-blue-600" />
        <Kpi label="Avg ATS gain" value={m.avgAtsGain === null ? '–' : `+${m.avgAtsGain} pts`} hint="first vs latest analysis" tone="text-green-600" />
        <Kpi label="Overdue tasks" value={m.overdueTasks} hint={`${m.openTasks} open · ${m.dueThisWeek} due this week`} tone={m.overdueTasks ? 'text-red-600' : 'text-slate-900'} />
        <Kpi label="On-time delivery" value={m.onTimeRate === null ? '–' : `${m.onTimeRate}%`} hint="completed tasks done by due date" tone="text-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-800">ATS score: first analysis vs latest</h4>
          <p className="text-xs text-slate-500 mb-4">How much each client's resume match has improved</p>
          <div className="h-[280px]">
            {atsChart.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={atsChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} unit="%" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="First" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Latest" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 pt-20 text-center">Run an ATS analysis to see client progress here.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-5">Onboarding pipeline</h4>
          <div className="space-y-5">
            {Object.values(OnboardingStatus).map(status => (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-slate-600">{status}</span>
                  <span className="font-semibold text-slate-500">{m.byStatus[status]}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct(m.byStatus[status])}%`, backgroundColor: STATUS_COLORS[status] }} />
                </div>
              </div>
            ))}
          </div>
          <h4 className="font-bold text-slate-800 mt-8 mb-3">Team workload</h4>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-slate-400 text-left"><th className="pb-2 font-semibold">Owner</th><th className="pb-2 font-semibold">Open</th><th className="pb-2 font-semibold">Overdue</th></tr></thead>
            <tbody>
              {m.workload.map(w => (
                <tr key={w.assignee} className="border-t border-slate-100">
                  <td className="py-2 font-medium text-slate-700">{w.assignee}</td>
                  <td className="py-2 text-slate-600">{w.open}</td>
                  <td className={`py-2 font-semibold ${w.overdue ? 'text-red-600' : 'text-slate-400'}`}>{w.overdue}</td>
                </tr>
              ))}
              {!m.workload.length && <tr><td colSpan={3} className="py-2 text-slate-400">No open tasks.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h4 className="font-bold text-slate-800">Clients needing attention</h4>
        <p className="text-xs text-slate-500 mb-4">Active clients with overdue tasks, a low ATS score (&lt; 60%) or no analysis yet</p>
        {m.clientsNeedingAttention.length ? (
          <div className="divide-y divide-slate-100">
            {m.clientsNeedingAttention.map(({ client, reasons }) => (
              <button key={client.id} onClick={() => onOpenClient(client)} className="w-full flex items-center justify-between py-3 text-left hover:bg-slate-50 px-2 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{client.name}</p>
                  <p className="text-xs text-slate-400">{client.targetRole ?? '—'} · {client.planType}</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  {reasons.map(r => (
                    <span key={r} className="text-[11px] font-semibold px-2 py-1 rounded-full bg-red-50 text-red-600">{r}</span>
                  ))}
                  {latest.has(client.id) && (
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600">ATS {latest.get(client.id)!.overallScore}%</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-green-600 font-medium">All active clients are on track 🎉</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
