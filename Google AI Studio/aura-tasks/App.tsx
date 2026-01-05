import React, { useState, useMemo, useEffect } from 'react';
import { Menu, Search, Sparkles, Plus, PlayCircle, CheckCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import BottomNavbar from './components/BottomNavbar';
import AuraChat from './components/AuraChat';
import DailySummary from './components/DailySummary';
import SettingsModal from './components/SettingsModal';
import TaskDetail from './components/TaskDetail';

// Views
import TasksView from './views/TasksView';
import NotesView from './views/NotesView';
import CRMView from './views/CRMView';
import PlanningView from './views/PlanningView';
import GalleryView from './views/GalleryView';
import ProjectsView from './views/ListsView'; 
import RecurringView from './views/RecurringView';
import AchievementsView from './views/AchievementsView';

import { parseCommand, getDailyQuote } from './utils/auraLogic';
import { Task, Project, User, Note, Contact, Transaction, Habit, FileItem, CustomView, TaskStatus } from './types';
import { AURA_IMAGE } from './utils/constants';

// --- STORAGE HELPERS ---
const load = <T,>(key: string, initial: T): T => {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : initial;
  } catch (e) { return initial; }
};
const save = (key: string, val: any) => localStorage.setItem(key, JSON.stringify(val));

export default function App() {
  // Main Section Navigation
  const [activeSection, setActiveSection] = useState('tasks');
  const [currentView, setCurrentView] = useState('hoy'); 

  // --- GLOBAL DATA ---
  
  // Statuses (New Feature)
  const [statuses, setStatuses] = useState<TaskStatus[]>(() => load('aura_statuses', [
    { id: 'todo', name: 'Por hacer', color: 'bg-gray-400', isCompleted: false },
    { id: 'in_progress', name: 'En curso', color: 'bg-blue-500', isCompleted: false },
    { id: 'review', name: 'Revisión', color: 'bg-purple-500', isCompleted: false },
    { id: 'done', name: 'Completada', color: 'bg-green-500', isCompleted: true }
  ]));

  const [tasks, setTasks] = useState<Task[]>(() => {
      const loaded = load('aura_tasks', []) as any[];
      // Migration: If task has old status string, map to new IDs
      return loaded.map(t => {
          if (t.status === 'pendiente') return { ...t, status: 'todo' };
          if (t.status === 'en_progreso') return { ...t, status: 'in_progress' };
          if (t.status === 'completada') return { ...t, status: 'done' };
          return t;
      });
  });

  const [projects, setProjects] = useState<Project[]>(() => load('aura_projects', [
    { id: '1', name: 'Personal', icon: '📝', color: 'text-blue-500' },
    { id: '2', name: 'Trabajo', icon: '💼', color: 'text-red-500' }
  ]));
  
  const [notes, setNotes] = useState<Note[]>(() => load('aura_notes', []));
  const [contacts, setContacts] = useState<Contact[]>(() => load('aura_crm', []));
  const [transactions, setTransactions] = useState<Transaction[]>(() => load('aura_finance', []));
  const [habits, setHabits] = useState<Habit[]>(() => load('aura_habits', []));
  const [files, setFiles] = useState<FileItem[]>(() => load('aura_files', [
    { id: 'f0', parentId: null, name: 'Documentos Trabajo', type: 'folder', source: 'local', updatedAt: Date.now() },
    { id: 'f1', parentId: 'f0', name: 'Contrato.pdf', type: 'pdf', source: 'local', size: '1.2MB', updatedAt: Date.now() },
    { id: 'f2', parentId: null, name: 'Logo.png', type: 'image', source: 'local', size: '0.5MB', updatedAt: Date.now() }
  ]));
  const [user, setUser] = useState<User>(() => load('aura_user', { name: 'Víctor', email: 'victor@aura.app', avatar: '👨‍💻', completedTasks: 0 }));
  const [customViews, setCustomViews] = useState<CustomView[]>(() => load('aura_custom_views', []));

  // UI State
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAura, setShowAura] = useState(false);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Quick Add State 
  const [quickAddText, setQuickAddText] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // Auto-save Effects
  useEffect(() => {
    save('aura_statuses', statuses);
    save('aura_tasks', tasks);
    save('aura_projects', projects);
    save('aura_notes', notes);
    save('aura_crm', contacts);
    save('aura_finance', transactions);
    save('aura_habits', habits);
    save('aura_files', files);
    save('aura_user', user);
    save('aura_custom_views', customViews);
  }, [statuses, tasks, projects, notes, contacts, transactions, habits, files, user, customViews]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddTask = (text: string | Task, eventDate?: string) => {
    // If passed a full Task object (from Modal or Calendar)
    if (typeof text === 'object') {
      setTasks(prev => [...prev, text]);
      showToast("Tarea creada");
      return;
    }
    
    // Quick Add from Input
    if (!text.trim()) return;

    // Use NLP to parse title and date
    const parsed = parseCommand(text);
    const newTasks: Task[] = parsed.map((p, i) => ({
      id: (Date.now() + i).toString(),
      title: p.title || text, // Clean title from NLP
      priority: p.priority || 'media',
      date: p.date || new Date().toISOString().split('T')[0], // Date from NLP
      status: 'todo', // Default new task status
      type: p.type || 'normal',
      listId: p.listId || '1',
      tags: [],
      eventDate: eventDate || p.eventDate,
      links: [], 
      ...p
    }));

    setTasks(prev => [...prev, ...newTasks]);
    setQuickAddText('');
    setIsQuickAdding(false);
    
    // Feedback
    if (newTasks.length > 0) {
       const t = newTasks[0];
       const dateMsg = t.date === new Date().toISOString().split('T')[0] ? "para hoy" : `para ${new Date(t.date).toLocaleDateString('es-ES', { weekday: 'long' })}`;
       showToast(`Tarea programada ${dateMsg}`);
    }
  };

  const openNewTaskModal = () => {
    // Open the TaskDetail modal with a blank task template
    const newTask: Task = {
      id: Date.now().toString(),
      title: '',
      priority: 'media',
      date: new Date().toISOString().split('T')[0],
      status: 'todo',
      type: 'normal',
      listId: '1',
      tags: [],
      links: []
    };
    setSelectedTask(newTask);
  };

  const handleUpdateTask = (updated: Task) => {
     setTasks(prev => {
        const exists = prev.find(t => t.id === updated.id);
        if (exists) {
           return prev.map(t => t.id === updated.id ? updated : t);
        } else {
           if (updated.title.trim()) {
             showToast("Tarea creada");
             return [...prev, updated];
           }
           return prev;
        }
     });
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setSelectedTask(null);
  };

  const handleUpdateView = (updatedView: CustomView) => {
      setCustomViews(prev => prev.map(v => v.id === updatedView.id ? updatedView : v));
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'tasks': 
        if (currentView === 'proyectos') {
            return <ProjectsView projects={projects} setProjects={setProjects} onOpenProject={(id) => {
                const projectView: CustomView = {
                     id: `project_view_${id}`,
                     name: projects.find(p => p.id === id)?.name || 'Proyecto',
                     icon: '📁',
                     layout: 'list',
                     groupBy: 'status',
                     filters: { projectIds: [id] }
                };
                setCustomViews(prev => {
                    const exists = prev.find(v => v.id === `project_view_${id}`);
                    if (exists) return prev;
                    return [...prev, projectView];
                });
                setCurrentView(`project_view_${id}`);
            }} />;
        }
        if (currentView === 'recurrentes') {
            return <RecurringView tasks={tasks} onAddTask={handleAddTask} />;
        }
        if (currentView === 'logros') {
            return <AchievementsView />;
        }
        
        // Check if it is a custom view
        const customView = customViews.find(v => v.id === currentView);
        
        return (
          <TasksView 
            tasks={tasks} setTasks={setTasks} 
            projects={projects} statuses={statuses}
            currentView={currentView} 
            customViewData={customView} 
            onUpdateView={handleUpdateView}
            onSelectTask={setSelectedTask} 
            userName={user.name} onOpenSummary={() => setShowDailySummary(true)}
          />
        );

      case 'notes': return (
        <NotesView 
          notes={notes} setNotes={setNotes} 
          tasks={tasks} contacts={contacts} files={files}
          showToast={showToast}
        />
      );
      case 'crm': return (
        <CRMView 
          contacts={contacts} setContacts={setContacts} 
          tasks={tasks} notes={notes} files={files}
          showToast={showToast}
        />
      );
      case 'planning': return <PlanningView tasks={tasks} onAddTask={handleAddTask} transactions={transactions} setTransactions={setTransactions} habits={habits} setHabits={setHabits} />;
      case 'gallery': return <GalleryView files={files} setFiles={setFiles} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden select-none">
      <Sidebar 
        user={user} currentView={currentView} setView={(v) => { setCurrentView(v); setActiveSection('tasks'); }} 
        showMenu={showSidebar} setShowMenu={setShowSidebar} 
        onOpenAura={() => setShowAura(true)} onOpenSettings={() => setShowSettings(true)}
        // Custom Views Props
        customViews={customViews}
        projects={projects}
        onCreateView={(v) => setCustomViews(prev => [...prev, v])}
        onDeleteView={(id) => {
            setCustomViews(prev => prev.filter(v => v.id !== id));
            if (currentView === id) setCurrentView('hoy');
        }}
      />

      <main className="flex-1 flex flex-col h-full relative overflow-hidden pb-20 md:pb-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(true)} className="lg:hidden p-2 text-gray-500"><Menu size={24} /></button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="capitalize">
                  {activeSection === 'tasks' ? (
                      currentView === 'hoy' ? 'Hoy' : 
                      currentView === 'todas' ? 'Todas' : 
                      currentView === 'proyectos' ? 'Proyectos' :
                      currentView === 'recurrentes' ? 'Recurrentes' :
                      currentView === 'logros' ? 'Logros' :
                      customViews.find(v => v.id === currentView)?.name || 'Tareas'
                  ) : (
                      activeSection === 'crm' ? 'CRM' : 
                      activeSection === 'notes' ? 'Notas' : 
                      activeSection === 'planning' ? 'Planificación' : 'Archivos'
                  )}
              </span>
            </h1>
          </div>
          <button onClick={() => setShowAura(true)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-full shadow-sm hover:shadow-md transition-all">
            <img src={AURA_IMAGE} className="w-6 h-6 rounded-full object-cover border border-white/30" alt="Aura" />
            <span className="text-sm font-bold">Aura</span>
          </button>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {renderActiveSection()}
        </div>
        
        {/* GLOBAL QUICK ADD BAR */}
        {activeSection === 'tasks' && currentView !== 'proyectos' && currentView !== 'recurrentes' && currentView !== 'logros' && (
          <div className="fixed bottom-[88px] md:bottom-8 left-4 right-4 md:left-[calc(50%+8rem)] md:right-8 z-30 flex justify-center md:justify-end pointer-events-none">
            <div className={`pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 flex items-center gap-2 transition-all duration-300 w-full md:max-w-xl ${isQuickAdding ? 'scale-100 opacity-100 ring-2 ring-indigo-500/20' : 'scale-95 opacity-90 hover:scale-100 hover:opacity-100'}`}>
              
              <button 
                onClick={openNewTaskModal}
                className="w-10 h-10 bg-indigo-100 hover:bg-indigo-600 hover:text-white rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0 transition-colors"
                title="Crear tarea detallada"
              >
                <Plus size={24} />
              </button>

              <input 
                type="text" 
                value={quickAddText} 
                onChange={(e) => setQuickAddText(e.target.value)} 
                onFocus={() => setIsQuickAdding(true)} 
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(quickAddText); }} 
                placeholder="Escribe 'Comprar pan mañana'..." 
                className="flex-1 border-none focus:ring-0 text-gray-700 placeholder:text-gray-400 text-base md:text-lg bg-transparent" 
              />
              {quickAddText && <button onClick={() => handleAddTask(quickAddText)} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors">Añadir</button>}
            </div>
          </div>
        )}

        <BottomNavbar activeSection={activeSection} setActiveSection={setActiveSection} />

        {toast && (
          <div className="fixed top-20 right-4 z-[100] bg-gray-900 text-white px-4 py-2 rounded-xl shadow-xl animate-fade-in-up flex items-center gap-2 pointer-events-none">
            <CheckCircle size={16} className="text-green-400" />
            {toast}
          </div>
        )}
      </main>

      <AuraChat 
        isOpen={showAura} onClose={() => setShowAura(false)} 
        tasks={tasks} userName={user.name} 
        onAddTask={handleAddTask} 
        onCommand={handleAddTask}
        onAddEvent={(title, date) => handleAddTask({ id: Date.now().toString(), title, date, priority: 'media', status: 'todo', type: 'event', listId: '1', tags: [] })}
      />
      
      <DailySummary isOpen={showDailySummary} onClose={() => setShowDailySummary(false)} tasks={tasks} userName={user.name} onUpdateTask={(t) => setTasks(prev => prev.map(old => old.id === t.id ? t : old))} />

      <SettingsModal 
        isOpen={showSettings} onClose={() => setShowSettings(false)} 
        user={user} onUpdateUser={setUser} 
        statuses={statuses} setStatuses={setStatuses}
      />

      {selectedTask && (
        <TaskDetail 
          task={selectedTask} lists={projects} statuses={statuses}
          notes={notes} contacts={contacts} files={files} allTasks={tasks}
          onClose={() => setSelectedTask(null)} 
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}