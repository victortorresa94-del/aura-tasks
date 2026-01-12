import React, { useState, useMemo, useEffect } from 'react';
import { Menu, Search, Sparkles, Plus, PlayCircle, CheckCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import BottomNavbar from './components/BottomNavbar';
import AuraChat from './components/AuraChat';
import DailySummary from './components/DailySummary';
import SettingsModal from './components/SettingsModal';
import TaskDetail from './components/TaskDetail';
import TopTabsBar from './components/TopTabsBar';
import LoginView from './views/LoginView';

// Views
import TasksView from './views/TasksView';
import NotesView from './views/NotesView';
import CRMView from './views/CRMView';
import PlanningView from './views/PlanningView';
import GalleryView from './views/GalleryView';
import ProjectsView from './views/ListsView';
import RecurringView from './views/RecurringView';
import InsightsView from './views/InsightsView';
import DashboardView from './views/DashboardView';
import TaskViewsSidebar from './components/TaskViewsSidebar';
import ProjectsSidebar from './components/ProjectsSidebar';
import ProjectDetailView from './views/ProjectDetailView';

import { parseCommand, getDailyQuote } from './utils/auraLogic';
import { Task, Project, User, Note, Contact, Transaction, Habit, FileItem, CustomView, TaskStatus, Tab, ChatSession } from './types';
import { AURA_IMAGE } from './utils/constants';

// --- GLOBAL DATA (Persisted) ---
import { usePersistedState } from './hooks/usePersistedState';
import { useAuth } from './contexts/AuthContext';
// --- REPOSITORIES ---
import { tasksRepo, projectsRepo, notesRepo, contactsRepo, filesRepo, customViewsRepo } from './firebase/repositories';
import { useFirestoreCollection } from './hooks/useFirestoreCollection';

export default function App() {
  // Main Section Navigation
  const [activeSection, setActiveSection] = usePersistedState('active_section', 'dashboard', 'aura_active_section');
  const [currentView, setCurrentView] = useState('hoy');

  // Tabs System
  const [tabs, setTabs] = usePersistedState<Tab[]>('tabs', [], 'aura_tabs');
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Statuses
  const [statuses, setStatuses] = usePersistedState<TaskStatus[]>('statuses', [
    { id: 'todo', name: 'Por hacer', color: 'bg-gray-700', isCompleted: false },
    { id: 'in_progress', name: 'En curso', color: 'bg-blue-600', isCompleted: false },
    { id: 'review', name: 'Revisión', color: 'bg-purple-600', isCompleted: false },
    { id: 'done', name: 'Completada', color: 'bg-green-600', isCompleted: true }
  ], 'aura_statuses');

  const { data: tasks, loading: tasksLoading } = useFirestoreCollection(tasksRepo);

  // Tab Handlers
  const handleAddTab = (tab: Tab) => {
    setTabs(prev => {
      if (prev.find(t => t.id === tab.id)) return prev;
      return [...prev, tab];
    });
    setActiveTabId(tab.id);
  };

  const handleSelectTab = (tab: Tab) => {
    setActiveTabId(tab.id);
    if (tab.type === 'project') {
      setActiveSection('projects');
      const viewId = `project_view_${tab.data.id}`;
      // Auto-create view if not exists logic is handled in Sidebar usually, but good to have here
      setCurrentView(viewId);
    } else if (tab.type === 'note') {
      setActiveSection('notes');
    } else if (tab.type === 'contact') {
      setActiveSection('crm');
    } else if (tab.type === 'task') {
      setActiveSection('tasks');
    } else if (tab.type === 'view') {
      const [section, view] = tab.path.split(':');
      if (section) setActiveSection(section);
      if (view) setCurrentView(view);
    }
  };

  const handleCloseTab = (id: string) => {
    setTabs(prev => prev.filter(t => t.id !== id));
    if (activeTabId === id) setActiveTabId(null);
  };

  const handleTogglePin = (id: string) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, isPinned: !t.isPinned } : t));
  };

  useEffect(() => {
    const matchingTab = tabs.find(t => {
      if (t.type === 'view' && t.path === `${activeSection}:${currentView}`) return true;
      return false;
    });
    if (matchingTab) setActiveTabId(matchingTab.id);
    else setActiveTabId(null);
  }, [activeSection, currentView, tabs]);

  // --- FIRESTORE COLLECTIONS ---
  const { data: projects, loading: projectsLoading } = useFirestoreCollection(projectsRepo);
  const { data: notes, loading: notesLoading } = useFirestoreCollection(notesRepo);
  const { data: contacts, loading: contactsLoading } = useFirestoreCollection(contactsRepo);
  const { data: files } = useFirestoreCollection(filesRepo);

  const [transactions, setTransactions] = usePersistedState<Transaction[]>('finance', [], 'aura_finance');
  const [habits, setHabits] = usePersistedState<Habit[]>('habits', [], 'aura_habits');

  // --- AUTH INTEGRATION ---
  const { user: authUser, loading: authLoading } = useAuth();

  const [localUserPreferences, setLocalUserPreferences] = usePersistedState<Partial<User>>('user_prefs', {
    completedTasks: 0
  }, 'aura_user_prefs');

  const user: User = useMemo(() => ({
    id: authUser?.uid || 'guest',
    name: authUser?.displayName || 'Usuario',
    email: authUser?.email || '',
    avatar: authUser?.photoURL || '👨‍💻',
    completedTasks: localUserPreferences.completedTasks || 0,
    onboardingCompleted: true
  }), [authUser, localUserPreferences]);

  const updateUser = (updated: User) => {
    setLocalUserPreferences(prev => ({ ...prev, ...updated }));
  };

  const { data: customViews } = useFirestoreCollection(customViewsRepo);

  // Chat History
  const [chatSessions, setChatSessions] = usePersistedState<ChatSession[]>('chat_sessions', [], 'aura_chat_sessions');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // UI State
  const [showSidebar, setShowSidebar] = useState(false);
  const [showTaskViewsSidebar, setShowTaskViewsSidebar] = useState(false);
  const [showProjectsSidebar, setShowProjectsSidebar] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined);
  const [showAura, setShowAura] = useState(false);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [quickAddText, setQuickAddText] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);


  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddTask = async (text: string | Task, eventDate?: string) => {
    if (typeof text === 'object') {
      await tasksRepo.create(user.id, text);
      showToast("Tarea creada");
      return;
    }
    if (!text.trim()) return;

    const parsed = parseCommand(text);
    const newTasks: Task[] = parsed.map((p, i) => ({
      id: (Date.now() + i).toString(),
      ownerId: user.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
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

    await tasksRepo.batchCreate(user.id, newTasks);
    setQuickAddText('');
    setIsQuickAdding(false);

    if (newTasks.length > 0) {
      const t = newTasks[0];
      const dateMsg = t.date === new Date().toISOString().split('T')[0] ? "para hoy" : `para ${new Date(t.date).toLocaleDateString('es-ES', { weekday: 'long' })}`;
      showToast(`Tarea programada ${dateMsg}`);
    }
  };

  const openNewTaskModal = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      ownerId: user.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
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

  const handleUpdateTask = async (updated: Task) => {
    const exists = tasks.find(t => t.id === updated.id);
    if (exists) {
      await tasksRepo.update(user.id, updated.id, updated);
    } else {
      if (updated.title.trim()) {
        await tasksRepo.create(user.id, updated);
        showToast("Tarea creada");
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    await tasksRepo.delete(user.id, id);
    setSelectedTask(null);
  };

  const handleUpdateView = (updatedView: CustomView) => {
    customViewsRepo.update(user.id, updatedView.id, updatedView);
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardView tasks={tasks} notes={notes} />;
      case 'insights':
        return <InsightsView tasks={tasks} transactions={transactions} habits={habits} projects={projects} statuses={statuses} />;
      case 'projects':
        const rawProjectId = currentView.replace('project_view_', '');
        const selectedProject = projects.find(p => p.id === rawProjectId);

        if (selectedProject) {
          return (
            <ProjectDetailView
              project={selectedProject}
              allTasks={tasks}
              allNotes={notes}
              allContacts={contacts}
              allFiles={files}
              statuses={statuses}
              onUpdateProject={(id, updates) => projectsRepo.update(user.id, id, updates)}
              onUpdateTask={(id, updates) => tasksRepo.update(user.id, id, updates)}
              onCreateTask={handleAddTask}
              onBack={() => setCurrentView('proyectos')}
              onAddTab={(label, type, data, path) => handleAddTab({ id: Date.now().toString(), label, type, data, path })}
            />
          );
        }
        return (
          <ProjectsView
            projects={projects}
            tasks={tasks}
            onOpenProject={(id) => setCurrentView(id)}
            onCreateProject={(p) => projectsRepo.create(user.id, p)}
            onUpdateProject={(id, u) => projectsRepo.update(user.id, id, u)}
            onDeleteProject={(id) => projectsRepo.delete(user.id, id)}
          />
        );

      case 'tasks':
        if (currentView === 'proyectos') {
          return (
            <ProjectsView
              projects={projects}
              tasks={tasks}
              onOpenProject={(id) => { setActiveSection('projects'); setCurrentView(id); }}
              onCreateProject={(p) => projectsRepo.create(user.id, p)}
              onUpdateProject={(id, u) => projectsRepo.update(user.id, id, u)}
              onDeleteProject={(id) => projectsRepo.delete(user.id, id)}
            />
          );
        }
        if (currentView === 'recurrentes') {
          return <RecurringView tasks={tasks} onAddTask={handleAddTask} />;
        }
        if (currentView === 'insights') {
          return <InsightsView tasks={tasks} transactions={transactions} habits={habits} projects={projects} statuses={statuses} />;
        }
        const customView = customViews.find(v => v.id === currentView);
        return (
          <TasksView
            tasks={tasks} setTasks={() => { }}
            projects={projects} statuses={statuses}
            currentView={currentView}
            customViewData={customView}
            onUpdateView={handleUpdateView}
            onSelectTask={setSelectedTask}
            onUpdateTask={handleUpdateTask}
            userName={user.name} onOpenSummary={() => setShowDailySummary(true)}
          />
        );

      case 'notes': return (
        <NotesView
          notes={notes}
          tasks={tasks} contacts={contacts} files={files}
          showToast={showToast}
          onCreateNote={(n) => notesRepo.create(user.id, n)}
          onUpdateNote={(id, u) => notesRepo.update(user.id, id, u)}
          onDeleteNote={(id) => notesRepo.delete(user.id, id)}
        />
      );
      case 'crm': return (
        <CRMView
          contacts={contacts} setContacts={() => { }}
          tasks={tasks} notes={notes} files={files}
          showToast={showToast}
        />
      );
      case 'planning': return <PlanningView tasks={tasks} onAddTask={handleAddTask} transactions={transactions} setTransactions={setTransactions} habits={habits} setHabits={setHabits} />;
      case 'gallery': return (
        <GalleryView
          files={files}
          onCreateFile={(f) => filesRepo.create(user.id, f)}
          onUpdateFile={(id, u) => filesRepo.update(user.id, id, u)}
          onDeleteFile={(id) => filesRepo.delete(user.id, id)}
        />
      );
      default: return null;
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full bg-aura-black flex items-center justify-center text-aura-white animate-pulse-slow">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-aura-gray animate-spin"></div>
          <p className="text-gray-400 font-light">Iniciando Aura...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen w-full bg-aura-black text-aura-white overflow-hidden select-none">
      <Sidebar
        user={user} currentView={currentView} setView={setCurrentView}
        activeSection={activeSection} setActiveSection={setActiveSection}
        showMenu={showSidebar} setShowMenu={setShowSidebar}
        onOpenAura={() => setShowAura(true)} onOpenSettings={() => setShowSettings(true)}
        customViews={customViews}
        projects={projects}
        onCreateView={(v) => customViewsRepo.create(user.id, v)}
        onDeleteView={(id) => {
          customViewsRepo.delete(user.id, id);
          if (currentView === id) setCurrentView('hoy');
        }}
        onAddTab={(label, type, data, path) => {
          const newTab: Tab = {
            id: Date.now().toString(),
            label, type, data, path
          };
          handleAddTab(newTab);
          showToast(`Pestaña agregada: ${label}`);
        }}
        setShowTaskViewsSidebar={setShowTaskViewsSidebar}
        setShowProjectsSidebar={setShowProjectsSidebar}
      />

      <TaskViewsSidebar
        isOpen={showTaskViewsSidebar}
        onClose={() => setShowTaskViewsSidebar(false)}
        currentView={currentView}
        setView={setCurrentView}
        customViews={customViews}
        onCreateView={(v) => customViewsRepo.create(user.id, v)}
        onDeleteView={(id) => {
          customViewsRepo.delete(user.id, id);
          if (currentView === id) setCurrentView('hoy');
        }}
      />

      {/* Projects Sidebar - shows when in projects section */}
      <ProjectsSidebar
        isOpen={showProjectsSidebar}
        onClose={() => setShowProjectsSidebar(false)}
        projects={projects}
        tasks={tasks}
        notes={notes}
        contacts={contacts}
        currentProjectId={currentProjectId}
        onSelectProject={(projectId) => {
          setCurrentProjectId(projectId);
          setCurrentView(`project_view_${projectId}`);
        }}
        onSelectTask={(task) => setSelectedTask(task)}
        onSelectNote={(note) => {
          setActiveSection('notes');
          // TODO: Add note selection
        }}
        onSelectContact={(contact) => {
          setActiveSection('crm');
          // TODO: Add contact selection
        }}
        onCreateProject={(project) => projectsRepo.create(user.id, project as Project)}
        onDeleteProject={(id) => projectsRepo.delete(user.id, id)}
      />

      <main className="flex-1 flex flex-col h-full relative overflow-hidden pb-16 md:pb-0 bg-aura-black">

        <div className="bg-aura-black/50 pt-2 px-2 border-b border-aura-gray/30">
          <TopTabsBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
            onTogglePin={handleTogglePin}
          />
        </div>

        <header className="h-14 lg:h-16 bg-aura-black border-b border-aura-gray/30 flex items-center justify-between px-3 lg:px-8 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(true)} className="lg:hidden p-2 text-gray-400 hover:text-white"><Menu size={24} /></button>
            <h1 className="text-lg lg:text-xl font-bold text-aura-white flex items-center gap-2">
              <span className="capitalize">
                {activeSection === 'tasks' ? (
                  currentView === 'hoy' ? 'Hoy' :
                    currentView === 'todas' ? 'Todas' :
                      currentView === 'proyectos' ? 'Proyectos' :
                        currentView === 'recurrentes' ? 'Recurrentes' :
                          currentView === 'insights' ? 'Insights' :
                            customViews.find(v => v.id === currentView)?.name || 'Tareas'
                ) : (
                  activeSection === 'crm' ? 'CRM' :
                    activeSection === 'notes' ? 'Notas' :
                      activeSection === 'planning' ? 'Planificación' : 'Archivos'
                )}
              </span>
            </h1>
          </div>
          <button onClick={() => setShowAura(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 bg-aura-gray hover:bg-aura-gray-light text-aura-white rounded-full shadow-sm hover:shadow-md transition-all border border-white/10">
            <img src={AURA_IMAGE} className="w-5 h-5 lg:w-6 lg:h-6 rounded-full object-cover border border-white/10" alt="Aura" />
            <span className="text-xs lg:text-sm font-semibold text-gray-200">Aura</span>
          </button>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {renderActiveSection()}
        </div>

        {/* Quick Add Backdrop */}
        {isQuickAdding && (
          <div
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setIsQuickAdding(false);
              setQuickAddText('');
            }}
          />
        )}

        {activeSection === 'tasks' && currentView !== 'proyectos' && currentView !== 'recurrentes' && currentView !== 'insights' && (
          <div className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 ${isQuickAdding ? 'pb-2' : 'pb-[80px] md:pb-8 pointer-events-none'}`}>
            <div className={`pointer-events-auto bg-aura-gray/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 p-2 flex items-center gap-3 transition-all duration-300 w-full md:max-w-xl mx-2 ${isQuickAdding ? 'translate-y-0 opacity-100 ring-1 ring-aura-accent/20' : 'translate-y-0 opacity-90 hover:scale-100 hover:opacity-100'}`}>

              <button
                onClick={openNewTaskModal}
                className="w-10 h-10 bg-aura-gray-light hover:bg-aura-accent hover:text-aura-black rounded-xl flex items-center justify-center text-aura-accent flex-shrink-0 transition-all border border-white/5"
                title="Crear tarea detallada"
              >
                <Plus size={22} />
              </button>

              <input
                type="text"
                value={quickAddText}
                onChange={(e) => setQuickAddText(e.target.value)}
                onFocus={() => setIsQuickAdding(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTask(quickAddText);
                    // Keep focus if needed or close? usually keep for multiple adds
                    // But for mobile, maybe close? Let's keep focus for speed.
                  }
                }}
                placeholder="Añadir tarea..."
                className="flex-1 border-none focus:ring-0 text-aura-white placeholder:text-gray-500 text-base bg-transparent h-full py-2"
              />

              <button
                onClick={() => handleAddTask(quickAddText)}
                disabled={!quickAddText.trim()}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${quickAddText.trim() ? 'bg-aura-accent text-aura-black shadow-lg shadow-aura-accent/20' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}
              >
                <div className="rotate-90"><PlayCircle size={20} /></div>
              </button>
            </div>
          </div>
        )}

        {!isQuickAdding && <BottomNavbar activeSection={activeSection} setActiveSection={setActiveSection} />}

        {toast && (
          <div className="fixed top-20 right-4 z-[100] bg-aura-gray border border-white/10 text-white px-4 py-2 rounded-xl shadow-xl animate-fade-in-up flex items-center gap-2 pointer-events-none">
            <CheckCircle size={16} className="text-aura-accent" />
            {toast}
          </div>
        )}
      </main>

      <AuraChat
        isOpen={showAura} onClose={() => setShowAura(false)}
        tasks={tasks} userName={user.name}
        contacts={contacts}
        projects={projects}
        onAddTask={handleAddTask}
        onUpdateTask={async (id, updates) => {
          await tasksRepo.update(user.id, id, updates);
          showToast("Tarea actualizada por Aura");
        }}
        onCommand={handleAddTask}
        onAddEvent={(title, date) => handleAddTask({
          id: Date.now().toString(),
          ownerId: user.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          title, date, priority: 'media', status: 'todo', type: 'event', listId: '1', tags: []
        })}
        onCreateContact={async (contact) => {
          await contactsRepo.create(user.id, {
            name: 'Nuevo Contacto',
            email: '', phone: '', tags: [], notes: '',
            ...contact,
            id: Date.now().toString(),
            ownerId: user.id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastContact: Date.now()
          });
          showToast("Contacto creado");
        }}
        onUpdateContact={(id, updates) => {
          contactsRepo.update(user.id, id, updates);
          showToast("Contacto actualizado");
        }}
        notes={notes}
        onCreateNote={async (title, content) => {
          await notesRepo.create(user.id, {
            id: Date.now().toString(),
            ownerId: user.id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            title,
            content,
            blocks: [{ id: 'b1', type: 'text', content }],
          });
          showToast("Nota creada");
        }}
        onUpdateNote={(id, updates) => {
          notesRepo.update(user.id, id, { ...updates, updatedAt: Date.now() });
          showToast("Nota actualizada");
        }}
        // History Props
        chatSessions={chatSessions}
        activeChatId={activeChatId}
        onSelectSession={setActiveChatId}
        onCreateSession={() => {
          const newId = Date.now().toString();
          setChatSessions(prev => [{ id: newId, title: 'Nueva conversación', messages: [], lastActive: Date.now() }, ...prev]);
          setActiveChatId(newId);
        }}
        onUpdateSession={(id, messages) => {
          setChatSessions(prev => prev.map(s => s.id === id ? { ...s, messages, lastActive: Date.now() } : s));
        }}
        onDeleteSession={(id) => {
          setChatSessions(prev => prev.filter(s => s.id !== id));
          if (activeChatId === id) setActiveChatId(null);
        }}
        onRenameSession={(id, title) => {
          setChatSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s));
        }}
      />

      <DailySummary isOpen={showDailySummary} onClose={() => setShowDailySummary(false)} tasks={tasks} userName={user.name} onUpdateTask={(t) => tasksRepo.update(user.id, t.id, t)} />

      <SettingsModal
        isOpen={showSettings} onClose={() => setShowSettings(false)}
        user={user} onUpdateUser={updateUser}
        statuses={statuses} setStatuses={setStatuses}
      />

      {selectedTask && (
        <TaskDetail
          task={selectedTask} lists={projects} statuses={statuses}
          notes={notes} contacts={contacts} files={files} allTasks={tasks}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          onAddTab={(label, type, data, path) => handleAddTab({ id: Date.now().toString(), label, type, data, path })}
        />
      )}
    </div>
  );
}