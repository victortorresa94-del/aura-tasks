import React, { useState } from 'react';
import { 
  Settings, LogOut, Layout, Briefcase, Repeat, Trophy, 
  ChevronDown, CheckCircle2, Filter, Plus, X, FolderKanban
} from 'lucide-react';
import { User as UserType, CustomView, Project, Priority } from '../types';
import { AURA_IMAGE } from '../utils/constants';

interface SidebarProps {
  user: UserType;
  currentView: string;
  setView: (view: string) => void;
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
  onOpenAura: () => void;
  onOpenSettings?: () => void;
  
  // Custom Views Data
  customViews: CustomView[];
  onCreateView: (view: CustomView) => void;
  onDeleteView: (id: string) => void;
  projects: Project[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
  user, currentView, setView, showMenu, setShowMenu, onOpenAura, onOpenSettings,
  customViews, onCreateView, onDeleteView, projects
}) => {
  const [isCreatingView, setIsCreatingView] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const menuItems = [
    { id: 'hoy', label: 'Hoy', icon: <CheckCircle2 size={18} /> },
    { id: 'todas', label: 'Todas las tareas', icon: <Layout size={18} /> },
    { id: 'proyectos', label: 'Proyectos', icon: <FolderKanban size={18} /> },
    { id: 'recurrentes', label: 'Recurrentes', icon: <Repeat size={18} /> },
    { id: 'logros', label: 'Logros', icon: <Trophy size={18} /> },
  ];

  const handleNavigation = (viewId: string) => {
    setView(viewId);
    setShowMenu(false);
  };

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión de ' + user.email + '?')) {
      window.location.reload();
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
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none
        ${showMenu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Profile Section */}
        <div className="p-6 border-b border-gray-50">
          <div 
            onClick={handleSettings}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-xl shadow-sm relative overflow-hidden border border-indigo-50">
               {isImageAvatar ? (
                 <img src={user.avatar} alt={user.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
               ) : (
                 <span className="group-hover:scale-110 transition-transform">{user.avatar}</span>
               )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 truncate">{user.name}</h3>
              <p className="text-xs text-gray-400 truncate font-medium">Plan Pro</p>
            </div>
            <ChevronDown size={16} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Main Menu */}
          <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2">Principal</p>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group ${
                currentView === item.id 
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`transition-colors ${currentView === item.id ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {item.icon}
              </span>
              {item.label}
              {currentView === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
              )}
            </button>
          ))}

          {/* Custom Views Section */}
          <div className="mt-6">
             <div className="flex items-center justify-between px-3 mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vistas Personalizadas</p>
                <button 
                  onClick={() => setIsCreatingView(!isCreatingView)} 
                  className="p-1 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                >
                  <Plus size={14} />
                </button>
             </div>
             
             {/* Creator Form */}
             {isCreatingView && (
               <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-indigo-100 animate-fade-in-up">
                  <input 
                    autoFocus
                    placeholder="Nombre de la vista..."
                    className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 mb-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                    value={newViewName}
                    onChange={e => setNewViewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateView()}
                  />
                  
                  <div className="flex gap-2 justify-end">
                     <button onClick={() => setIsCreatingView(false)} className="text-xs text-gray-500 hover:text-gray-800">Cancelar</button>
                     <button onClick={handleCreateView} disabled={!newViewName.trim()} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded font-bold hover:bg-indigo-700 disabled:opacity-50">Crear</button>
                  </div>
               </div>
             )}

             {/* Views List */}
             {customViews.map(view => (
                <div key={view.id} className="group relative">
                  <button
                    onClick={() => handleNavigation(view.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      currentView === view.id 
                        ? 'bg-purple-50 text-purple-700 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Filter size={16} className={currentView === view.id ? 'text-purple-600' : 'text-gray-400'} />
                    <span className="truncate">{view.name}</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteView(view.id); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                     <X size={12} />
                  </button>
                </div>
             ))}
             {customViews.length === 0 && !isCreatingView && (
                <div className="px-3 py-4 text-center border-2 border-dashed border-gray-100 rounded-xl m-2">
                   <p className="text-[10px] text-gray-400">Crea tu primera vista.</p>
                </div>
             )}
          </div>

          {/* Aura Promotion Section */}
          <button 
            onClick={() => { onOpenAura(); setShowMenu(false); }}
            className="w-full text-left mt-8 mx-0 p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all transform hover:scale-[1.02]"
          >
             <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 group-hover:opacity-30 transition-opacity"></div>
             <div className="relative z-10 flex items-center gap-3">
               <div className="relative">
                 <img 
                   src={AURA_IMAGE} 
                   className="w-10 h-10 rounded-full border-2 border-white/20 object-cover bg-gray-800"
                   alt="Aura"
                 />
                 <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
               </div>
               <div>
                 <p className="text-white text-sm font-bold group-hover:text-indigo-200 transition-colors">Hablar con Aura</p>
                 <p className="text-gray-400 text-xs">Asistente IA activa</p>
               </div>
             </div>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="px-6 py-4 border-t border-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Productividad</span>
            <span className="text-xs font-bold text-indigo-600">{user.completedTasks} tareas</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" 
              style={{ width: '65%' }}
            ></div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 space-y-1">
          <button 
            onClick={handleSettings}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-xl transition-colors hover:text-gray-900"
          >
            <Settings size={18} />
            Configuración
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
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