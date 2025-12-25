
import React from 'react';
import { Task, TaskStatus, Client } from '../types';

interface TaskBoardProps {
  tasks: Task[];
  clients: Client[];
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, clients }) => {
  const columns = [
    { id: TaskStatus.TODO, label: 'To Do', color: 'bg-slate-200' },
    { id: TaskStatus.IN_PROGRESS, label: 'In Progress', color: 'bg-blue-400' },
    { id: TaskStatus.DONE, label: 'Completed', color: 'bg-green-400' },
  ];

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Unknown';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-[calc(100vh-250px)]">
      {columns.map(col => (
        <div key={col.id} className="flex flex-col h-full bg-slate-100/50 rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className={`w-2 h-2 rounded-full ${col.color}`}></div>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{col.label}</h4>
            <span className="ml-auto text-[10px] font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200">
              {tasks.filter(t => t.status === col.id).length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {tasks
              .filter(t => t.status === col.id)
              .map(task => (
                <div 
                  key={task.id} 
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                      {task.type}
                    </span>
                    <button className="text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100">•••</button>
                  </div>
                  <h5 className="text-sm font-bold text-slate-800 leading-snug">{task.title}</h5>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{getClientName(task.clientId)}</p>
                  
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-blue-600">
                        {task.assignedTo[0]}
                      </div>
                    </div>
                    <div className="text-[9px] font-bold text-slate-400">
                      Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskBoard;
