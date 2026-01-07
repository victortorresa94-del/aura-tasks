import React, { useState, useMemo, useEffect } from 'react';
import { Menu, Search, Sparkles, Plus, PlayCircle, CheckCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import BottomNavbar from './components/BottomNavbar';
import AuraChat from './components/AuraChat';
import DailySummary from './components/DailySummary';
import SettingsModal from './components/SettingsModal';
import TaskDetail from './components/TaskDetail';
import TopTabsBar from './components/TopTabsBar';

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
  const [activeSection, setActiveSection] = useState('dashboard');
  const [currentView, setCurrentView] = useState('hoy');

  // Tabs System
  const [tabs, setTabs] = usePersistedState<Tab[]>('tabs', [], 'aura_tabs');
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Statuses
  const [statuses, setStatuses] = usePersistedState<TaskStatus[]>('statuses', [
    { id: 'todo', name: 'Por hacer', color: 'bg-gray-400', isCompleted: false },
    { id: 'in_progress', name: 'En curso', color: 'bg-blue-500', isCompleted: false },
    { id: 'review', name: 'Revisión', color: 'bg-purple-500', isCompleted: false },
    { id: 'done', name: 'Completada', color: 'bg-green-500', isCompleted: true }
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
    // Parse path to navigate
    // Format: 'section:view_id' or special 'project:id'
    if (tab.type === 'project') {
      setActiveSection('projects');
      setCurrentView(`project_view_${tab.data.id}`);
      // We need a way to open the specific project view. 
      // Current Sidebar implementation opens it if we set currentView to 'project_view_ID'
      const viewId = `project_view_${tab.data.id}`;

      // Ensure the view exists in customViews (or transiently create it?)
      // For now, let's assuming SideBar handles re-creation/finding if we assume it's there?
      // Actually, we should trigger the "Open Project" logic.
      // Replicating logic from renderActiveSection (case 'tasks'):
      const projectView: CustomView = {
        id: viewId,
        name: tab.data.name,
        icon: '📁',
        layout: 'list',
        groupBy: 'status',
        filters: { projectIds: [tab.data.id] }
      };

      // Auto-create view if not exists (checked by ID consistency with Tab)
      const exists = customViews.find(v => v.id === viewId);
      if (!exists) {
        customViewsRepo.create(user.id, projectView);
      }

      setCurrentView(viewId);

    } else if (tab.type === 'note') {
      setActiveSection('notes');
      // Potential improvement: open specific note details. For now, just go to section.
      // If we had a selectedNote state, we could set it here.
    } else if (tab.type === 'contact') {
      setActiveSection('crm');
      // Similar to notes, could set active contact.
    } else if (tab.type === 'task') {
      setActiveSection('tasks');
      // Could filter or highlight specific task.
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

  // Sync Active Tab with Current Navigation (Optional/Advanced)
  useEffect(() => {
    // Find if current view matches any tab
    const matchingTab = tabs.find(t => {
      // Simple heuristic matching
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
  // Files persist removed (replaced by filesRepo collection)
  // const [files, setFiles] = ... removed


  // --- AUTH INTEGRATION ---
  const { user: authUser } = useAuth();

  // We maintain a local 'user' state for app-specific fields (like completedTasks)
  // but sync basic info from Auth
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
    // Update local prefs
    setLocalUserPreferences(prev => ({ ...prev, ...updated }));
    // TODO: Update Firebase Profile if name/avatar changed (handled in SettingsModal)
  };

  const { data: customViews } = useFirestoreCollection(customViewsRepo);

  // Chat History
  const [chatSessions, setChatSessions] = usePersistedState<ChatSession[]>('chat_sessions', [], 'aura_chat_sessions');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // UI State
  const [showSidebar, setShowSidebar] = useState(false);
  const [showTaskViewsSidebar, setShowTaskViewsSidebar] = useState(false);
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
    // If passed a full Task object (from Modal or Calendar)
    if (typeof text === 'object') {
      await tasksRepo.create(user.id, text);
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

    await tasksRepo.batchCreate(user.id, newTasks);
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
      case 'projects':
        // Check if currentView is a specific project ID (e.g., 'project_view_123' or just ID if we simplified)
        // Sidebar sets setView(p.id) -> so currentView is '1' or '2'.
        // handleSelectTab sets currentView(`project_view_${id}`) -> let's standardize on just ID or handle both.
        // Let's assume ID for simplicity. If Sidebar sets '1', check for '1'.

        // Clean ID from 'project_view_' prefix if present
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

        // Default Dashboard
        return (
          <ProjectsView
            projects={projects}
            tasks={tasks}
            setProjects={(newProjects: any) => { /* Handle projects setter removal, maybe add adapter? */ }}
            onOpenProject={(id) => setCurrentView(id)}
          />
        );

      case 'tasks':
        if (currentView === 'proyectos') {
          // Redirect legacy access to new section
          return <ProjectsView projects={projects} tasks={tasks} setProjects={() => { }} onOpenProject={(id) => { setActiveSection('projects'); setCurrentView(id); }} />;
        }
        if (currentView === 'recurrentes') {
          return <RecurringView tasks={tasks} onAddTask={handleAddTask} />;
        }
        if (currentView === 'insights') {
          return <InsightsView tasks={tasks} transactions={transactions} habits={habits} projects={projects} statuses={statuses} />;
        }

        // Check if it is a custom view
        const customView = customViews.find(v => v.id === currentView);

        return (
          <TasksView
            tasks={tasks} setTasks={() => { }} // Disabled setTasks prop legacy
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
          notes={notes} setNotes={() => { }}
          tasks={tasks} contacts={contacts} files={files}
          showToast={showToast}
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
      case 'gallery': return <GalleryView files={files} setFiles={() => { }} />;
      default: return null;
    }
  };

  // ... (inside return statement) ...
  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden select-none">
      <Sidebar
        user={user} currentView={currentView} setView={(v) => { setCurrentView(v); setActiveSection('tasks'); }}
        activeSection={activeSection} setActiveSection={setActiveSection}
        showMenu={showSidebar} setShowMenu={setShowSidebar}
        onOpenAura={() => setShowAura(true)} onOpenSettings={() => setShowSettings(true)}
        // Custom Views Props
        customViews={customViews}
        projects={projects}
        onCreateView={(v) => customViewsRepo.create(v, user.id)}
        onDeleteView={(id) => {
          customViewsRepo.delete(id, user.id);
          if (currentView === id) setCurrentView('hoy');
        }}
        // Tabs Support
        onAddTab={(label, type, data, path) => {
          const newTab: Tab = {
            id: Date.now().toString(),
            label, type, data, path
          };
          handleAddTab(newTab);
          showToast(`Pestaña agregada: ${label}`);
        }}
        setShowTaskViewsSidebar={setShowTaskViewsSidebar}
      />

      {/* Secondary Sidebar for Task Views */}
      <TaskViewsSidebar
        isOpen={showTaskViewsSidebar}
        onClose={() => setShowTaskViewsSidebar(false)}
        currentView={currentView}
        setView={setCurrentView}
        customViews={customViews}
        onCreateView={(v) => customViewsRepo.create(v, user.id)}
        onDeleteView={(id) => {
          customViewsRepo.delete(id, user.id);
          if (currentView === id) setCurrentView('hoy');
        }}
      />

      <main className="flex-1 flex flex-col h-full relative overflow-hidden pb-16 md:pb-0">

        {/* TOP TABS BAR */}
        <div className="bg-gray-100/50 pt-2 px-2">
          <TopTabsBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
            onTogglePin={handleTogglePin}
          />
        </div>

        <header className="h-14 lg:h-16 bg-white border-b border-gray-100 flex items-center justify-between px-3 lg:px-8 shrink-0 z-20">
          <div className="flex items-center gap-3">
            {/* ... header content ... */}
            <button onClick={() => setShowSidebar(true)} className="lg:hidden p-2 text-gray-500"><Menu size={24} /></button>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2">
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
          <button onClick={() => setShowAura(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 bg-indigo-600 text-white rounded-full shadow-sm hover:shadow-md transition-all">
            <img src={AURA_IMAGE} className="w-5 h-5 lg:w-6 lg:h-6 rounded-full object-cover border border-white/30" alt="Aura" />
            <span className="text-xs lg:text-sm font-bold">Aura</span>
          </button>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {renderActiveSection()}
        </div>

        {/* GLOBAL QUICK ADD BAR */}
        {activeSection === 'tasks' && currentView !== 'proyectos' && currentView !== 'recurrentes' && currentView !== 'insights' && (
          <div className="fixed bottom-[68px] md:bottom-8 left-4 right-4 md:left-[calc(50%+8rem)] md:right-8 z-30 flex justify-center md:justify-end pointer-events-none">
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
        contacts={contacts}
        projects={projects}
        onAddTask={handleAddTask}
        onUpdateTask={async (id, updates) => {
          await tasksRepo.update(user.id, id, updates);
          showToast("Tarea actualizada por Aura");
        }}
        onCommand={handleAddTask}
        onAddEvent={(title, date) => handleAddTask({ id: Date.now().toString(), title, date, priority: 'media', status: 'todo', type: 'event', listId: '1', tags: [] })}
        onCreateContact={async (contact) => {
          await contactsRepo.create(user.id, {
            name: 'Nuevo Contacto',
            email: '', phone: '', tags: [], notes: '',
            ...contact,
            id: Date.now().toString(),
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
            title,
            content,
            blocks: [{ id: 'b1', type: 'text', content }],
            updatedAt: Date.now()
          }, user.id);
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