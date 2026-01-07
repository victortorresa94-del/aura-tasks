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
    const projectTasks = useMemo(() => allTasks.filter(t => t.listId === project.id || t.projectId === project.id), [allTasks, project.id]);
    const projectNotes = useMemo(() => allNotes.filter(n => n.projectId === project.id), [allNotes, project.id]);
    const projectContacts = useMemo(() => allContacts.filter(c => c.projectId === project.id), [allContacts, project.id]);

    // Calculate progress
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
        <div className="h-full flex flex-col bg-aura-black text-aura-white animate-fade-in-up">
            {/* HEADER */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-aura-black/50 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/5 border border-white/10`}>
                        {project.icon}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            {project.name}
                            <button
                                onClick={() => onAddTab(project.name, 'project', project, `project:${project.id}`)}
                                className="text-gray-600 hover:text-aura-accent transition-colors"
                                title="Añadir a favoritos"
                            >
                                <Trophy size={16} />
                            </button>
                        </h1>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                                <Calendar size={14} /> Creado recientemente
                            </span>
                            <span>•</span>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-aura-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                </div>
                                <span className="font-medium text-aura-accent">{progress}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
                        <Settings size={20} />
                    </button>
                    <button
                        onClick={() => onCreateTask({
                            id: Date.now().toString(),
                            ownerId: '',
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                            title: '',
                            priority: 'media',
                            date: new Date().toISOString().split('T')[0],
                            status: 'todo',
                            type: 'normal',
                            listId: project.id,
                            projectId: project.id,
                            tags: [],
                            links: []
                        })}
                        className="bg-aura-accent text-aura-black px-4 py-2 rounded-xl font-bold hover:bg-aura-accent/90 flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} /> Añadir Tarea
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div className="px-6 border-b border-white/5 flex gap-6 shrink-0 overflow-x-auto bg-aura-black">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as ProjectTab)}
                        className={`flex items-center gap-2 py-4 border-b-2 transition-all whitespace-nowrap text-sm ${activeTab === tab.id
                            ? 'border-aura-accent text-aura-accent font-bold'
                            : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto bg-aura-black p-6 custom-scrollbar">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* STATUS CARD */}
                        <div className="bg-aura-gray/30 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                            <h3 className="font-bold text-gray-300 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider">
                                <CheckSquare size={16} className="text-aura-accent" /> Estado de Tareas
                            </h3>
                            <div className="space-y-3">
                                {statuses.map(s => {
                                    const count = projectTasks.filter(t => t.status === s.id).length;
                                    return (
                                        <div key={s.id} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${s.color}`}></div>
                                                <span className="text-gray-400 group-hover:text-white transition-colors text-sm">{s.name}</span>
                                            </div>
                                            <span className="font-bold text-gray-500 group-hover:text-white transition-colors">{count}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* RECENT NOTES */}
                        <div className="bg-aura-gray/30 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                            <h3 className="font-bold text-gray-300 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider">
                                <StickyNote size={16} className="text-yellow-500" /> Notas Recientes
                            </h3>
                            {projectNotes.length === 0 ? (
                                <p className="text-gray-600 text-sm italic">No hay notas vinculadas.</p>
                            ) : (
                                <div className="space-y-2">
                                    {projectNotes.slice(0, 3).map(n => (
                                        <div key={n.id} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group">
                                            <h4 className="font-bold text-gray-300 group-hover:text-aura-accent text-sm mb-1">{n.title}</h4>
                                            <p className="text-gray-600 text-xs truncate">{n.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* TEAM / CRM */}
                        <div className="bg-aura-gray/30 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                            <h3 className="font-bold text-gray-300 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider">
                                <Users size={16} className="text-purple-500" /> Equipo & Contactos
                            </h3>
                            {projectContacts.length === 0 ? (
                                <p className="text-gray-600 text-sm italic">No hay contactos vinculados.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {projectContacts.map(c => (
                                        <div key={c.id} className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                            <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] text-purple-400 font-bold">
                                                {c.avatar || c.name[0]}
                                            </div>
                                            <span className="text-xs font-medium text-gray-300">{c.name}</span>
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
                            <div key={t.id} className="bg-aura-gray/20 p-4 rounded-xl border border-white/5 flex items-center justify-between group hover:bg-aura-gray/40 transition-all">
                                <div className="flex items-center gap-3">
                                    <button
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${t.status === 'done' ? 'bg-aura-accent border-aura-accent' : 'border-gray-600 hover:border-aura-accent'}`}
                                        onClick={() => onUpdateTask(t.id, { status: t.status === 'done' ? 'todo' : 'done' })}
                                    >
                                        {t.status === 'done' && <CheckSquare size={12} className="text-black" />}
                                    </button>
                                    <span className={t.status === 'done' ? 'line-through text-gray-600' : 'text-gray-200'}>{t.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded-lg ${t.priority === 'alta' ? 'bg-red-500/20 text-red-400' : t.priority === 'media' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                                        {t.priority}
                                    </span>
                                    <button
                                        onClick={() => onAddTab(t.title, 'task', t, 'tasks')}
                                        className="text-gray-600 hover:text-aura-accent opacity-0 group-hover:opacity-100 transition-all p-2"
                                        title="Añadir a favoritos"
                                    >
                                        <Trophy size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {projectTasks.length === 0 && (
                            <div className="text-center py-16 text-gray-600">
                                <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No hay tareas en este proyecto.</p>
                                <button className="mt-4 text-aura-accent hover:underline text-sm">Crear primera tarea</button>
                            </div>
                        )}
                    </div>
                )}

                {/* NOTES TAB */}
                {activeTab === 'notes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectNotes.map(n => (
                            <div key={n.id} className="bg-aura-gray/20 p-6 rounded-xl border border-white/5 hover:border-aura-accent/30 hover:bg-aura-gray/40 transition-all relative group cursor-pointer">
                                <h4 className="font-bold text-gray-200 mb-2 pr-8">{n.title}</h4>
                                <p className="text-gray-500 text-sm line-clamp-3 font-light">{n.content}</p>
                                <button
                                    onClick={() => onAddTab(n.title, 'note', n, 'notes')}
                                    className="absolute top-4 right-4 text-gray-600 hover:text-aura-accent opacity-0 group-hover:opacity-100 transition-all"
                                    title="Añadir a favoritos"
                                >
                                    <Trophy size={16} />
                                </button>
                            </div>
                        ))}
                        {projectNotes.length === 0 && (
                            <div className="col-span-full text-center py-16 text-gray-600">
                                <StickyNote size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No hay notas creadas.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* CRM TAB */}
                {activeTab === 'crm' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectContacts.map(c => (
                            <div key={c.id} className="bg-aura-gray/20 p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:border-aura-accent/30 hover:bg-aura-gray/40 transition-all relative group cursor-pointer">
                                <div className="w-12 h-12 rounded-full bg-aura-accent/10 flex items-center justify-center text-aura-accent font-bold text-lg border border-aura-accent/20">
                                    {c.avatar || c.name[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-200">{c.name}</p>
                                    <p className="text-sm text-gray-500">{c.role || 'Sin cargo'}</p>
                                </div>
                                <button
                                    onClick={() => onAddTab(c.name, 'contact', c, 'crm')}
                                    className="absolute top-4 right-4 text-gray-600 hover:text-aura-accent opacity-0 group-hover:opacity-100 transition-all"
                                    title="Añadir a favoritos"
                                >
                                    <Trophy size={16} />
                                </button>
                            </div>
                        ))}
                        {projectContacts.length === 0 && (
                            <div className="col-span-full text-center py-16 text-gray-600">
                                <Users size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No hay personas vinculadas.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* FILES TAB */}
                {activeTab === 'files' && (
                    <div className="text-center py-20 text-gray-600">
                        <FileText size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Funcionalidad de Archivos en desarrollo.</p>
                    </div>
                )}

            </div>
        </div>
    );
}

export default ProjectDetailView;
