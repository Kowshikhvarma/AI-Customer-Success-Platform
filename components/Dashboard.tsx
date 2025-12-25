
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { Client, Task, TaskStatus } from '../types';

interface DashboardProps {
  clients: Client[];
  tasks: Task[];
}

const Dashboard: React.FC<DashboardProps> = ({ clients, tasks }) => {
  const stats = [
    { label: 'Total Clients', value: clients.length, change: '+12%', color: 'text-blue-600' },
    { label: 'Avg. ATS Score', value: '74%', change: '+5%', color: 'text-green-600' },
    { label: 'Active Tasks', value: tasks.filter(t => t.status !== TaskStatus.DONE).length, change: '-2', color: 'text-orange-600' },
    { label: 'Completion Rate', value: '89%', change: '+1.2%', color: 'text-indigo-600' },
  ];

  const chartData = [
    { name: 'Mon', apps: 12, scores: 65 },
    { name: 'Tue', apps: 19, scores: 72 },
    { name: 'Wed', apps: 15, scores: 68 },
    { name: 'Thu', apps: 22, scores: 75 },
    { name: 'Fri', apps: 30, scores: 82 },
    { name: 'Sat', apps: 10, scores: 78 },
    { name: 'Sun', apps: 8, scores: 74 },
  ];

  const clientDistribution = [
    { name: 'Basic', value: clients.filter(c => c.planType === 'Basic').length },
    { name: 'Premium', value: clients.filter(c => c.planType === 'Premium').length },
    { name: 'Enterprise', value: clients.filter(c => c.planType === 'Enterprise').length },
  ];

  const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6'];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className={`text-3xl font-bold ${stat.color}`}>{stat.value}</h3>
              <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-800">Weekly Performance Trends</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-slate-500 font-medium">Applications</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                <span className="text-xs text-slate-500 font-medium">Avg Score</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="apps" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="scores" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-6">Client Segments</h4>
          <div className="space-y-6">
            {clientDistribution.map((item, idx) => {
              const total = clients.length;
              const percentage = Math.round((item.value / total) * 100);
              return (
                <div key={item.name}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-600">{item.name}</span>
                    <span className="text-xs font-bold text-slate-400">{percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%`, backgroundColor: COLORS[idx] }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-12 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
            <p className="text-xs text-slate-500 font-medium">Success Tip</p>
            <p className="text-xs text-slate-400 mt-1">Enterprise clients show 20% higher conversion rates this month.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
