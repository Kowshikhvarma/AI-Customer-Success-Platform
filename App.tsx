import React, { useState } from 'react';
import Layout, { View } from './components/Layout';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import TaskBoard from './components/TaskBoard';
import ResumeAnalysis from './components/ResumeAnalysis';
import ClientModal, { ModalMode } from './components/ClientModal';
import { useAppStore } from './lib/store';
import { Client } from './types';

const App: React.FC = () => {
  const store = useAppStore();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [modal, setModal] = useState<{ open: boolean; mode: ModalMode; client?: Client }>({ open: false, mode: 'add' });
  const [analysisClientId, setAnalysisClientId] = useState<string>('');

  const openModal = (mode: ModalMode, client?: Client) => setModal({ open: true, mode, client });

  const handleSaveClient = (client: Client) => {
    store.upsertClient(client);
    if (modal.mode === 'add') setActiveView('clients');
    setModal(m => ({ ...m, open: false }));
  };

  const openAnalysisFor = (clientId: string) => {
    setAnalysisClientId(clientId);
    setModal(m => ({ ...m, open: false }));
    setActiveView('analysis');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'clients':
        return (
          <ClientList
            clients={store.clients}
            tasks={store.tasks}
            atsRecords={store.atsRecords}
            onEdit={c => openModal('edit', c)}
            onView={c => openModal('view', c)}
            onDelete={store.deleteClient}
          />
        );
      case 'tasks':
        return (
          <TaskBoard
            tasks={store.tasks}
            clients={store.clients}
            onAdd={store.addTask}
            onMove={store.moveTask}
            onDelete={store.deleteTask}
          />
        );
      case 'analysis':
        return (
          <ResumeAnalysis
            clients={store.clients}
            atsRecords={store.atsRecords}
            selectedClientId={analysisClientId}
            onSelectClient={setAnalysisClientId}
            onSaveScore={store.recordAts}
            onCreateTasks={(clientId, titles) =>
              titles.forEach(title =>
                store.addTask({ clientId, title, type: 'Editing', assignedTo: 'Kowshikh',
                  dueDate: new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10) }),
              )
            }
          />
        );
      default:
        return (
          <Dashboard
            clients={store.clients}
            tasks={store.tasks}
            atsRecords={store.atsRecords}
            onOpenClient={c => openModal('view', c)}
          />
        );
    }
  };

  return (
    <>
      <Layout
        activeView={activeView}
        setActiveView={setActiveView}
        onNewClientClick={() => openModal('add')}
        onResetDemo={() => {
          if (confirm('Reset all data to the demo workspace?')) store.resetDemo();
        }}
      >
        {renderContent()}
      </Layout>

      <ClientModal
        isOpen={modal.open}
        mode={modal.mode}
        client={modal.client}
        tasks={store.tasks}
        atsRecords={store.atsRecords}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        onSave={handleSaveClient}
        onEdit={c => openModal('edit', c)}
        onRunAnalysis={openAnalysisFor}
      />
    </>
  );
};

export default App;
