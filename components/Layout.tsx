import React from 'react';
import { hasGeminiKey } from '../services/geminiService';

export type View = 'dashboard' | 'clients' | 'tasks' | 'analysis';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  setActiveView: (view: View) => void;
  onNewClientClick: () => void;
  onResetDemo: () => void;
}

const MENU: { id: View; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'clients', label: 'Clients', icon: '👥' },
  { id: 'tasks', label: 'Tasks', icon: '📋' },
  { id: 'analysis', label: 'ATS Analysis', icon: '🤖' },
];

const TITLES: Record<View, string> = {
  dashboard: 'Dashboard',
  clients: 'Clients',
  tasks: 'Task Board',
  analysis: 'ATS Resume Analysis',
};

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, onNewClientClick, onResetDemo }) => {
  const aiOn = hasGeminiKey();
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            SuccessPath AI
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Customer Success Platform</p>
        </div>

        <nav className="flex-1 mt-6">
          {MENU.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                activeView === item.id
                  ? 'bg-blue-600 text-white border-r-4 border-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="m-4 p-4 bg-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${aiOn ? 'bg-green-400' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-semibold">{aiOn ? 'Gemini AI connected' : 'Offline ATS engine'}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Data is saved in this browser. Demo data is fictional.
          </p>
          <button onClick={onResetDemo} className="text-[11px] font-semibold text-blue-300 hover:text-blue-200">
            ↺ Reset demo data
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-800">{TITLES[activeView]}</h2>
          <button
            onClick={onNewClientClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Client
          </button>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
