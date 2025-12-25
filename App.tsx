
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import TaskBoard from './components/TaskBoard';
import ResumeAnalysis from './components/ResumeAnalysis';
import ClientModal, { ModalMode } from './components/ClientModal';
import { INITIAL_CLIENTS, INITIAL_TASKS } from './constants';
import { Client } from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [tasks] = useState(INITIAL_TASKS);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [selectedClient, setSelectedClient] = useState<Client | undefined>(undefined);

  const handleOpenAdd = () => {
    setModalMode('add');
    setSelectedClient(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setModalMode('edit');
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleOpenView = (client: Client) => {
    setModalMode('view');
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleSaveClient = (updatedClient: Client) => {
    if (modalMode === 'add') {
      setClients(prev => [updatedClient, ...prev]);
      setActiveView('clients');
    } else if (modalMode === 'edit') {
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    }
    setIsModalOpen(false);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard clients={clients} tasks={tasks} />;
      case 'clients':
        return (
          <ClientList 
            clients={clients} 
            onEdit={handleOpenEdit} 
            onView={handleOpenView} 
          />
        );
      case 'tasks':
        return <TaskBoard tasks={tasks} clients={clients} />;
      case 'analysis':
        return <ResumeAnalysis />;
      default:
        return <Dashboard clients={clients} tasks={tasks} />;
    }
  };

  return (
    <>
      <Layout 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onNewClientClick={handleOpenAdd}
      >
        {renderContent()}
      </Layout>

      <ClientModal 
        isOpen={isModalOpen} 
        mode={modalMode}
        client={selectedClient}
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveClient} 
      />
    </>
  );
};

export default App;
