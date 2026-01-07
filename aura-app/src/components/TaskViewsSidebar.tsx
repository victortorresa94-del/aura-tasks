import React, { useState } from 'react';
import {
    CheckCircle2, Layout, Repeat, Filter, Plus, X, ChevronLeft
} from 'lucide-react';
import { CustomView } from '../types';

interface TaskViewsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    currentView: string;
    setView: (view: string) => void;
    customViews: CustomView[];
    onCreateView: (view: CustomView) => void;
    onDeleteView: (id: string) => void;
}

const TaskViewsSidebar: React.FC<TaskViewsSidebarProps> = ({
    isOpen, onClose, currentView, setView, customViews, onCreateView, onDeleteView
}) => {
    const [isCreatingView, setIsCreatingView] = useState(false);
    const [newViewName, setNewViewName] = useState('');

    const taskMenuItems = [
        { id: 'hoy', label: 'Hoy', icon: <CheckCircle2 size={18} /> },
        { id: 'todas', label: 'Todas las tareas', icon: <Layout size={18} /> },
        { id: 'recurrentes', label: 'Recurrentes', icon: <Repeat size={18} /> },
    ];

    const handleNavigation = (viewId: string) => {
        setView(viewId);
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

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Secondary Sidebar */}
            <aside className={`
        fixed lg:relative inset-y-0 left-0 lg:left-auto z-50 lg:z-auto w-64 bg-aura-black border-r border-white/5 
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}
      `}>
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-aura-gray/10">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Vistas de Tareas</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
                        title="Contraer"
                    >
                        <ChevronLeft size={18} />
                    </button>
                </div>

                {/* Navigation */}
                <div className="p-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">

                    {/* Default Views */}
                    <div className="mb-6 space-y-1">
                        {taskMenuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavigation(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${currentView === item.id
                                    ? 'bg-aura-accent/10 text-aura-accent font-semibold border border-aura-accent/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-aura-white'
                                    }`}
                            >
                                <span className={`transition-colors ${currentView === item.id ? 'text-aura-accent' : 'text-gray-500'}`}>
                                    {item.icon}
                                </span>
                                <span className="flex-1 text-left">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Custom Views Section */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between px-3 mb-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Listas Personalizadas</p>
                            <button
                                onClick={() => setIsCreatingView(!isCreatingView)}
                                className="p-1 hover:bg-white/10 text-gray-500 hover:text-aura-accent rounded"
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        {/* Creator Form */}
                        {isCreatingView && (
                            <div className="bg-aura-gray/20 rounded-xl p-3 mb-3 border border-aura-accent/30 animate-fade-in-up">
                                <input
                                    autoFocus
                                    placeholder="Nombre..."
                                    className="w-full text-xs bg-aura-black/50 border border-white/10 rounded-lg px-2 py-1.5 mb-2 focus:ring-1 focus:ring-aura-accent outline-none text-aura-white"
                                    value={newViewName}
                                    onChange={e => setNewViewName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreateView()}
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => setIsCreatingView(false)}
                                        className="text-xs text-gray-500 hover:text-white"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCreateView}
                                        disabled={!newViewName.trim()}
                                        className="text-xs bg-aura-accent text-aura-black px-2 py-1 rounded font-bold hover:bg-white disabled:opacity-50"
                                    >
                                        Crear
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Views List */}
                        {customViews.map(view => (
                            <div key={view.id} className="group relative">
                                <button
                                    onClick={() => handleNavigation(view.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${currentView === view.id
                                        ? 'bg-aura-gray/30 text-aura-white border border-white/5 shadow-sm'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-aura-white'
                                        }`}
                                >
                                    <Filter size={16} className={currentView === view.id ? 'text-aura-accent' : 'text-gray-500'} />
                                    <span className="truncate flex-1 text-left">{view.name}</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteView(view.id); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        {customViews.length === 0 && !isCreatingView && (
                            <div className="px-3 py-4 text-center border-2 border-dashed border-white/5 rounded-xl m-2 bg-white/5">
                                <p className="text-[10px] text-gray-500">Crea tu primera vista.</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default TaskViewsSidebar;
