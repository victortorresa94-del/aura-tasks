import React, { useState } from 'react';
import {
  Settings, LogOut, Layout, Briefcase, Repeat, Trophy,
  ChevronDown, CheckCircle2, Filter, Plus, X, FolderKanban,
  CheckSquare, StickyNote, Users, BarChart3, Image as ImageIcon, LayoutDashboard
} from 'lucide-react';
import { logout } from '../firebase/auth';
import { User as UserType, CustomView, Project, Priority } from '../types';
import { AURA_IMAGE } from '../utils/constants';

interface SidebarProps {
  user: UserType;
  currentView: string;
  setView: (view: string) => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
  onOpenAura: () => void;
  onOpenSettings?: () => void;

  // Custom Views Data
  customViews: CustomView[];
  onCreateView: (view: CustomView) => void;
  onDeleteView: (id: string) => void;
  projects: Project[];

  // Tabs
  onAddTab: (label: string, type: 'view' | 'project' | 'entity' | 'note' | 'task' | 'contact', data: any, path: string) => void;

  // Task Views Sidebar
  setShowTaskViewsSidebar?: (value: boolean | ((prev: boolean) => boolean)) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  user, currentView, setView, activeSection, setActiveSection,
  showMenu, setShowMenu, onOpenAura, onOpenSettings,
  customViews, onCreateView, onDeleteView, projects, onAddTab, setShowTaskViewsSidebar
}) => {
  const [isCreatingView, setIsCreatingView] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  // Top-level sections
  const topSections = [
    { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard size={18} /> },
    { id: 'projects', label: 'Proyectos', icon: <FolderKanban size={18} /> },
    { id: 'insights', label: 'Insights', icon: <BarChart3 size={18} /> },
  ];

  // Application sections
  const appSections = [
    { id: 'tasks', label: 'Tareas', icon: <CheckSquare size={18} /> },
    { id: 'notes', label: 'Notas', icon: <StickyNote size={18} /> },
    { id: 'crm', label: 'CRM', icon: <Users size={18} /> },
    { id: 'planning', label: 'Planning', icon: <ChevronDown size={18} /> },
    { id: 'gallery', label: 'Archivos', icon: <ImageIcon size={18} /> },
  ];



  const handleNavigation = (viewId: string) => {
    setView(viewId);
    if (window.innerWidth < 1024) setShowMenu(false);
  };

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    // Toggle task views sidebar when clicking Tasks
    if (sectionId === 'tasks') {
      setShowTaskViewsSidebar(prev => !prev);
    } else {
      setShowTaskViewsSidebar(false);
    }
    // If switching to Projects, might want to default to 'all_projects' or list
    if (sectionId === 'projects') {
      setView('proyectos'); // Special view ID for project list
    }
    if (window.innerWidth < 1024) setShowMenu(false);
  };

  // ... (handleLogout, handleSettings, handleCreateView remain same) ...
  const handleLogout = async () => {
    if (confirm('¿Cerrar sesión de ' + user.email + '?')) {
      try {
        await logout();
        // AuthContext will handle the redirect to login
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  };

  const handleSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
      setShowMenu(false);
    }
  };

  const handleCreateView = () => {
    if (!newViewName.trim()) return;

    const newView: CustomView = {
      id: Date.now().toString(),
      name: newViewName,
      icon: '⚡',
      layout: 'list',
      groupBy: 'none',
      filters: {}
    };
    onCreateView(newView);
    setIsCreatingView(false);
    setNewViewName('');
    handleNavigation(newView.id);
  };

  const isImageAvatar = user.avatar.startsWith('http') || user.avatar.includes('/');

  // Reusable Star Button
  const StarBtn = ({ label, type, data, path, visible }: { label: string, type: 'view' | 'project', data: any, path: string, visible: boolean }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onAddTab(label, type, data, path); }}
      className={`ml-auto p-1 text-gray-300 hover:text-yellow-400 transition-opacity ${visible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      title="Añadir a favoritos"
    >
      <Trophy size={14} className={type === 'project' ? 'fill-current' : ''} />
    </button>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-aura-black border-r border-aura-gray/30 
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none
        ${showMenu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Profile Section */}
        <div className="p-6 border-b border-aura-gray/30">
          {/* ... profile content same ... */}
          <div
            onClick={handleSettings}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-aura-gray transition-colors cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-aura-gray flex items-center justify-center text-xl shadow-sm relative overflow-hidden border border-aura-gray-light">
              {isImageAvatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              ) : (
                <span className="group-hover:scale-110 transition-transform text-aura-white">{user.avatar}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-aura-white truncate">{user.name}</h3>
              <p className="text-xs text-gray-400 truncate font-medium">Plan Pro</p>
            </div>
            <ChevronDown size={16} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">

          {/* Top-level Sections */}
          <div className="mb-6 space-y-1">
            {topSections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group relative ${activeSection === section.id
                  ? 'bg-aura-gray text-white shadow-md border border-white/5'
                  : 'text-gray-400 hover:bg-aura-gray/50 hover:text-aura-white'
                  }`}
              >
                <div className={`${activeSection === section.id ? 'text-aura-accent' : 'text-gray-500 group-hover:text-gray-300'}`}>
                  {section.icon}
                </div>
                {section.label}
              </button>
            ))}
          </div>

          {/* Apps Sections */}
          <div className="mb-6 space-y-1">
            <p className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Aplicaciones</p>
            {appSections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group relative ${activeSection === section.id
                  ? 'bg-aura-gray text-white shadow-md border border-white/5'
                  : 'text-gray-400 hover:bg-aura-gray/50 hover:text-aura-white'
                  }`}
              >
                <div className={`${activeSection === section.id ? 'text-aura-accent' : 'text-gray-500 group-hover:text-gray-300'}`}>
                  {section.icon}
                </div>
                {section.label}
              </button>
            ))}
          </div>

          {/* Projects List (Only if Projects is Active) */}
          {activeSection === 'projects' && (
            <div className="animate-fade-in-up">
              <p className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4">Mis Proyectos</p>
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setView(p.id); /* Navigate logic */ }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-gray-400 hover:bg-aura-gray/50 hover:text-aura-white group transition-all"
                >
                  <span>{p.icon}</span>
                  <span className="flex-1 text-left">{p.name}</span>
                  <StarBtn label={p.name} type="project" data={p} path={`project:${p.id}`} visible={false} />
                </button>
              ))}
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-aura-accent hover:bg-aura-gray/50 rounded-xl mt-2 font-medium transition-colors">
                <Plus size={16} /> Crear Proyecto
              </button>
            </div>
          )}

          {/* Aura Promotion Section */}
          <button
            onClick={() => { onOpenAura(); setShowMenu(false); }}
            className="w-full text-left mt-8 mx-0 p-4 bg-gradient-to-br from-aura-gray to-aura-black rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all transform hover:scale-[1.02] border border-white/5"
          >
            {/* ... same aura button ... */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative z-10 flex items-center gap-3">
              <div className="relative">
                <img src={AURA_IMAGE} className="w-10 h-10 rounded-full border-2 border-white/10 object-cover bg-gray-800" alt="Aura" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
              </div>
              <div>
                <p className="text-white text-sm font-bold group-hover:text-aura-accent transition-colors">Hablar con Aura</p>
                <p className="text-gray-500 text-xs">Asistente IA activa</p>
              </div>
            </div>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="px-6 py-4 border-t border-aura-gray/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Productividad</span>
            <span className="text-xs font-bold text-aura-accent">{user.completedTasks} tareas</span>
          </div>
          <div className="w-full bg-aura-gray h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-aura-accent h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: '65%' }}
            ></div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-aura-gray/30 space-y-1">
          <button
            onClick={handleSettings}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-aura-gray/50 rounded-xl transition-colors hover:text-aura-white"
          >
            <Settings size={18} />
            Configuración
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-red-900/20 hover:text-red-400 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;