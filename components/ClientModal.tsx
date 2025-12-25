
import React, { useState, useEffect } from 'react';
import { Client, OnboardingStatus } from '../types';

export type ModalMode = 'add' | 'edit' | 'view';

interface ClientModalProps {
  isOpen: boolean;
  mode: ModalMode;
  client?: Client;
  onClose: () => void;
  onSave: (client: Client) => void;
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, mode, client, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    planType: 'Basic' as 'Basic' | 'Premium' | 'Enterprise',
    status: OnboardingStatus.PENDING,
  });

  useEffect(() => {
    if (client && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        planType: client.planType,
        status: client.status,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        planType: 'Basic',
        status: OnboardingStatus.PENDING,
      });
    }
  }, [client, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;

    const savedClient: Client = {
      id: client?.id || Math.random().toString(36).substr(2, 9),
      ...formData,
      createdAt: client?.createdAt || new Date().toISOString().split('T')[0],
    };
    onSave(savedClient);
    onClose();
  };

  const isView = mode === 'view';
  const title = mode === 'add' ? 'Add New Client' : mode === 'edit' ? 'Edit Client' : 'Client Profile';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            {isView && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">ID: {client?.id}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
            <input
              required
              disabled={isView}
              type="text"
              placeholder="e.g. John Smith"
              className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isView ? 'bg-slate-50 text-slate-500' : ''}`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
            <input
              required
              disabled={isView}
              type="email"
              placeholder="john@example.com"
              className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isView ? 'bg-slate-50 text-slate-500' : ''}`}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
              <input
                required
                disabled={isView}
                type="tel"
                placeholder="555-0000"
                className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isView ? 'bg-slate-50 text-slate-500' : ''}`}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Tier</label>
              <select
                disabled={isView}
                className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isView ? 'bg-slate-50 text-slate-500' : ''}`}
                value={formData.planType}
                onChange={(e) => setFormData({ ...formData, planType: e.target.value as any })}
              >
                <option value="Basic">Basic</option>
                <option value="Premium">Premium</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          { (mode === 'edit' || mode === 'view') && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Onboarding Status</label>
              <select
                disabled={isView}
                className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${isView ? 'bg-slate-50 text-slate-500' : ''}`}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value={OnboardingStatus.PENDING}>Pending</option>
                <option value={OnboardingStatus.IN_PROGRESS}>In Progress</option>
                <option value={OnboardingStatus.COMPLETED}>Completed</option>
              </select>
            </div>
          )}

          {isView && client && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
               <p className="text-[10px] font-bold text-slate-400 uppercase">Registered on</p>
               <p className="text-sm font-semibold text-slate-600">{new Date(client.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {isView ? 'Close' : 'Cancel'}
            </button>
            {!isView && (
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
              >
                {mode === 'add' ? 'Save Client' : 'Update Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;
