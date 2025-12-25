
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import TaskBoard from './components/TaskBoard';
import ResumeAnalysis from './components/ResumeAnalysis';
import { INITIAL_CLIENTS, INITIAL_TASKS } from './constants';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [clients] = useState(INITIAL_CLIENTS);
  const [tasks] = useState(INITIAL_TASKS);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard clients={clients} tasks={tasks} />;
      case 'clients':
        return <ClientList clients={clients} />;
      case 'tasks':
        return <TaskBoard tasks={tasks} clients={clients} />;
      case 'analysis':
        return <ResumeAnalysis />;
      default:
        return <Dashboard clients={clients} tasks={tasks} />;
    }
  };

  return (
    <Layout activeView={activeView} setActiveView={setActiveView}>
      {renderContent()}
    </Layout>
  );
};

export default App;
