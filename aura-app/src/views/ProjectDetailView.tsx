import React, { useState, useMemo } from 'react';
import {
    Layout, CheckSquare, StickyNote, Users, FileText,
    Plus, Search, Filter, MoreHorizontal, Calendar,
    ChevronRight, Trophy, ArrowLeft, Settings
} from 'lucide-react';
import { Project, Task, Note, Contact, FileItem, TaskStatus } from '../types';

interface ProjectDetailViewProps {
    project: Project;
    allTasks: Task[];
    allNotes: Note[];
    allContacts: Contact[];
    allFiles: FileItem[];
    statuses: TaskStatus[];

    onUpdateProject: (id: string, updates: Partial<Project>) => void;
    onUpdateTask: (id: string, updates: Partial<Task>) => void;
    onCreateTask: (task: Task) => void;
    // Add other handlers as needed
    onBack: () => void;
    onAddTab: (label: string, type: 'view' | 'project' | 'note' | 'task' | 'contact', data: any, path: string) => void;
}

type ProjectTab = 'overview' | 'tasks' | 'notes' | 'crm' | 'files';

const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
    project, allTasks, allNotes, allContacts, allFiles, statuses,
    onUpdateProject, onUpdateTask, onCreateTask, onBack, onAddTab
}) => {
    const [activeTab, setActiveTab] = useState<ProjectTab>('overview');

    // Filter Data for this Project
    const projectTasks = useMemo(() => allTasks.filter(t => t.listId === project.id), [allTasks, project.id]);
    const projectNotes = useMemo(() => allNotes.filter(n => n.projectId === project.id), [allNotes, project.id]);
    const projectContacts = useMemo(() => allContacts.filter(c => c.projectId === project.id), [allContacts, project.id]);
    // Files might need linking logic, for now assume loose linking or none

    const completedTasks = projectTasks.filter(t => t.status === 'done').length;
    const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;

    const tabs = [
        { id: 'overview', label: 'General', icon: <Layout size={18} /> },
        { id: 'tasks', label: `Tareas (${projectTasks.length})`, icon: <CheckSquare size={18} /> },
        { id: 'notes', label: `Notas (${projectNotes.length})`, icon: <StickyNote size={18} /> },
        { id: 'crm', label: `Personas (${projectContacts.length})`, icon: <Users size={18} /> },
        { id: 'files', label: 'Archivos', icon: <FileText size={18} /> },
    ];

    return (
        <div className="h-full flex flex-col bg-white">
            {/* HEADER */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${project.color} bg-opacity-10 bg-gray-50`}>
                        {project.icon}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            {project.name}
                            <button
                                onClick={() => onAddTab(project.name, 'project', project, `project:${project.id}`)}
                                className="text-gray-300 hover:text-yellow-400 transition-colors"
                                title="Añadir a favoritos"
                            >
                                <Trophy size={16} />
                            </button>
                        </h1>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Calendar size={14} /> Creado recientemente
                            </span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                                <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>
                                <span className="font-medium">{progress}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                        <Settings size={20} />
                    </button>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 flex items-center gap-2">
                        <Plus size={18} /> Añadir Tarea
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div className="px-6 border-b border-gray-100 flex gap-6 shrink-0 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as ProjectTab)}
                        className={`flex items-center gap-2 py-3 border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'border-indigo-600 text-indigo-600 font-medium'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* STATUS CARD */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <CheckSquare size={20} className="text-blue-500" /> Estado de Tareas
                            </h3>
                            <div className="space-y-3">
                                {statuses.map(s => {
                                    const count = projectTasks.filter(t => t.status === s.id).length;
                                    return (
                                        <div key={s.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${s.color}`}></div>
                                                <span className="text-gray-600 text-sm">{s.name}</span>
                                            </div>
                                            <span className="font-bold text-gray-900">{count}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* RECENT NOTES */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <StickyNote size={20} className="text-yellow-500" /> Notas Recientes
                            </h3>
                            {projectNotes.length === 0 ? (
                                <p className="text-gray-400 text-sm">No hay notas vinculadas.</p>
                            ) : (
                                <div className="space-y-2">
                                    {projectNotes.slice(0, 3).map(n => (
                                        <div key={n.id} className="p-3 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors cursor-pointer">
                                            <h4 className="font-bold text-gray-800 text-sm">{n.title}</h4>
                                            <p className="text-gray-500 text-xs truncate">{n.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* TEAM / CRM */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Users size={20} className="text-purple-500" /> Equipo & Contactos
                            </h3>
                            {projectContacts.length === 0 ? (
                                <p className="text-gray-400 text-sm">No hay contactos vinculados.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {projectContacts.map(c => (
                                        <div key={c.id} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs">
                                                {c.avatar || c.name[0]}
                                            </div>
                                            <span className="text-xs font-medium text-gray-700">{c.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TASKS TAB */}
                {activeTab === 'tasks' && (
                    <div className="flex flex-col gap-2">
                        {projectTasks.map(t => (
                            <div key={t.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between group hover:shadow-sm transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 ${t.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}></div>
                                    <span className={t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}>{t.title}</span>
                                </div>
                                <button
                                    onClick={() => onAddTab(t.title, 'task', t, 'tasks')}
                                    className="text-gray-300 hover:text-yellow-400 opacity-0 group-hover:opacity-100 transition-all p-2"
                                    title="Añadir a favoritos"
                                >
                                    <Trophy size={16} /> {/* Using Trophy as Star alternative or reuse Star if imported */}
                                </button>
                            </div>
                        ))}
                        {projectTasks.length === 0 && <p className="text-center text-gray-400 py-10">No hay tareas en este proyecto.</p>}
                    </div>
                )}

                {/* NOTES TAB */}
                {activeTab === 'notes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectNotes.map(n => (
                            <div key={n.id} className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow relative group">
                                <h4 className="font-bold text-gray-800 mb-2 pr-8">{n.title}</h4>
                                <p className="text-gray-500 text-sm line-clamp-3">{n.content}</p>
                                <button
                                    onClick={() => onAddTab(n.title, 'note', n, 'notes')}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-yellow-400 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Añadir a favoritos"
                                >
                                    <Trophy size={16} />
                                </button>
                            </div>
                        ))}
                        {projectNotes.length === 0 && <p className="col-span-full text-center text-gray-400 py-10">No hay notas en este proyecto.</p>}
                    </div>
                )}

                {/* CRM TAB */}
                {activeTab === 'crm' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectContacts.map(c => (
                            <div key={c.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow relative group">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                    {c.avatar || c.name[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{c.name}</p>
                                    <p className="text-sm text-gray-500">{c.role || 'Sin cargo'}</p>
                                </div>
                                <button
                                    onClick={() => onAddTab(c.name, 'contact', c, 'crm')}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-yellow-400 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Añadir a favoritos"
                                >
                                    <Trophy size={16} />
                                </button>
                            </div>
                        ))}
                        {projectContacts.length === 0 && <p className="col-span-full text-center text-gray-400 py-10">No hay contactos en este proyecto.</p>}
                    </div>
                )}

                {/* FILES TAB */}
                {activeTab === 'files' && (
                    <div className="text-center py-20 text-gray-400">
                        <p>Funcionalidad de Archivos en desarrollo.</p>
                    </div>
                )}

            </div>
        </div>
    );
}

export default ProjectDetailView;
