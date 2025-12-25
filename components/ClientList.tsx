
import React from 'react';
import { Client, OnboardingStatus } from '../types';

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onView: (client: Client) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onEdit, onView }) => {
  const getStatusColor = (status: OnboardingStatus) => {
    switch (status) {
      case OnboardingStatus.COMPLETED: return 'bg-green-100 text-green-700';
      case OnboardingStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700';
      case OnboardingStatus.PENDING: return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-lg">Manage Clients</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search clients..." 
            className="text-sm border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
          <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            🔍
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
              <th className="px-6 py-4">Client Name</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="font-semibold text-slate-700">{client.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                    client.planType === 'Enterprise' ? 'border-purple-200 text-purple-600' : 
                    client.planType === 'Premium' ? 'border-blue-200 text-blue-600' : 'border-slate-200 text-slate-500'
                  }`}>
                    {client.planType}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getStatusColor(client.status)}`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs text-slate-600 font-medium">{client.email}</p>
                  <p className="text-[10px] text-slate-400">{client.phone}</p>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {new Date(client.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(client)}
                      className="p-1 px-2 text-blue-600 hover:bg-blue-50 rounded text-xs font-bold"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => onView(client)}
                      className="p-1 px-2 text-slate-400 hover:bg-slate-100 rounded text-xs font-bold"
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientList;
