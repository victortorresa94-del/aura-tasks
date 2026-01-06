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
        fixed lg:relative inset-y-0 left-0 lg:left-auto z-50 lg:z-auto w-64 bg-white border-r border-gray-100 
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}
      `}>
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Vistas de Tareas</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
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
                                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <span className={`transition-colors ${currentView === item.id ? 'text-indigo-600' : 'text-gray-400'}`}>
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
                                className="p-1 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded"
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        {/* Creator Form */}
                        {isCreatingView && (
                            <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-indigo-100 animate-fade-in-up">
                                <input
                                    autoFocus
                                    placeholder="Nombre..."
                                    className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 mb-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    value={newViewName}
                                    onChange={e => setNewViewName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreateView()}
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => setIsCreatingView(false)}
                                        className="text-xs text-gray-500 hover:text-gray-800"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleCreateView}
                                        disabled={!newViewName.trim()}
                                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded font-bold hover:bg-indigo-700 disabled:opacity-50"
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
                                        ? 'bg-purple-50 text-purple-700 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Filter size={16} className={currentView === view.id ? 'text-purple-600' : 'text-gray-400'} />
                                    <span className="truncate flex-1 text-left">{view.name}</span>
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
                </div>
            </aside>
        </>
    );
};

export default TaskViewsSidebar;
