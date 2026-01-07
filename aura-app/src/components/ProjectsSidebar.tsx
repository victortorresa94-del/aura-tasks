import React, { useState, useMemo } from 'react';
import {
    FolderOpen, ChevronRight, ChevronDown, ChevronLeft, Plus, MoreHorizontal,
    FileText, CheckSquare, Users, Trash2, Edit2, FolderPlus
} from 'lucide-react';
import { Project, Task, Note, Contact } from '../types';

interface ProjectsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    tasks: Task[];
    notes: Note[];
    contacts: Contact[];
    onSelectProject: (projectId: string) => void;
    onSelectTask: (task: Task) => void;
    onSelectNote: (note: Note) => void;
    onSelectContact: (contact: Contact) => void;
    onCreateProject: (project: Partial<Project>) => void;
    onDeleteProject: (id: string) => void;
    currentProjectId?: string;
}

const ProjectsSidebar: React.FC<ProjectsSidebarProps> = ({
    isOpen, onClose, projects, tasks, notes, contacts,
    onSelectProject, onSelectTask, onSelectNote, onSelectContact,
    onCreateProject, onDeleteProject, currentProjectId
}) => {
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: Set<string> }>({});
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [contextMenu, setContextMenu] = useState<{ projectId: string; x: number; y: number } | null>(null);

    // Group items by projectId
    const projectData = useMemo(() => {
        return projects.map(project => ({
            ...project,
            tasks: tasks.filter(t => t.projectId === project.id || t.listId === project.id),
            notes: notes.filter(n => n.projectId === project.id),
            contacts: contacts.filter(c => c.projectId === project.id)
        }));
    }, [projects, tasks, notes, contacts]);

    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => {
            const newSet = new Set(prev);
            if (newSet.has(projectId)) {
                newSet.delete(projectId);
            } else {
                newSet.add(projectId);
            }
            return newSet;
        });
    };

    const toggleSection = (projectId: string, section: string) => {
        setExpandedSections(prev => {
            const projectSections = prev[projectId] || new Set();
            const newSet = new Set(projectSections);
            if (newSet.has(section)) {
                newSet.delete(section);
            } else {
                newSet.add(section);
            }
            return { ...prev, [projectId]: newSet };
        });
    };

    const handleCreateProject = () => {
        if (!newProjectName.trim()) return;

        onCreateProject({
            id: Date.now().toString(),
            name: newProjectName,
            color: '#2DD4BF',
            icon: '📁'
        });
        setNewProjectName('');
        setIsCreating(false);
    };

    const handleContextMenu = (e: React.MouseEvent, projectId: string) => {
        e.preventDefault();
        setContextMenu({ projectId, x: e.clientX, y: e.clientY });
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

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-[100] bg-aura-gray border border-white/10 rounded-xl shadow-2xl py-2 min-w-[160px]"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={() => setContextMenu(null)}
                >
                    <button
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                        onClick={() => {/* TODO: Edit project */ }}
                    >
                        <Edit2 size={14} /> Renombrar
                    </button>
                    <button
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                        onClick={() => onDeleteProject(contextMenu.projectId)}
                    >
                        <Trash2 size={14} /> Eliminar
                    </button>
                </div>
            )}

            {/* Click outside to close context menu */}
            {contextMenu && (
                <div className="fixed inset-0 z-[99]" onClick={() => setContextMenu(null)} />
            )}

            {/* Sidebar Panel */}
            <aside className={`
                fixed lg:relative inset-y-0 left-0 lg:left-auto z-50 lg:z-auto w-72 bg-black border-r border-white/5 
                transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}
            `}>
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-aura-gray/10">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <FolderOpen size={16} className="text-aura-accent" />
                        Proyectos
                    </h3>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsCreating(true)}
                            className="p-1.5 hover:bg-aura-accent/10 rounded-lg text-gray-500 hover:text-aura-accent transition-colors"
                            title="Nuevo proyecto"
                        >
                            <Plus size={16} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
                            title="Contraer"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    </div>
                </div>

                {/* New Project Input */}
                {isCreating && (
                    <div className="p-3 border-b border-white/5 bg-aura-gray/20">
                        <div className="flex items-center gap-2">
                            <FolderPlus size={16} className="text-aura-accent shrink-0" />
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateProject();
                                    if (e.key === 'Escape') setIsCreating(false);
                                }}
                                placeholder="Nombre del proyecto..."
                                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-gray-500"
                                autoFocus
                            />
                            <button
                                onClick={handleCreateProject}
                                className="text-xs bg-aura-accent text-black px-2 py-1 rounded font-bold"
                            >
                                Crear
                            </button>
                        </div>
                    </div>
                )}

                {/* Projects List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {projectData.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm py-8">
                            <FolderOpen size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No hay proyectos</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="mt-2 text-aura-accent hover:underline text-xs"
                            >
                                Crear el primero
                            </button>
                        </div>
                    ) : (
                        projectData.map(project => {
                            const isExpanded = expandedProjects.has(project.id);
                            const projectSections = expandedSections[project.id] || new Set();
                            const isSelected = currentProjectId === project.id;

                            return (
                                <div key={project.id} className="select-none">
                                    {/* Project Header */}
                                    <div
                                        className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer group transition-all ${isSelected
                                                ? 'bg-aura-accent/10 border border-aura-accent/20'
                                                : 'hover:bg-white/5'
                                            }`}
                                        onClick={() => {
                                            toggleProject(project.id);
                                            onSelectProject(project.id);
                                        }}
                                        onContextMenu={(e) => handleContextMenu(e, project.id)}
                                    >
                                        <span className="text-gray-500 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                            <ChevronRight size={14} />
                                        </span>
                                        <span className="text-lg">{project.icon || '📁'}</span>
                                        <span className={`flex-1 text-sm font-medium truncate ${isSelected ? 'text-aura-accent' : 'text-gray-300'}`}>
                                            {project.name}
                                        </span>
                                        <span className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {project.tasks.length + project.notes.length + project.contacts.length}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleContextMenu(e, project.id); }}
                                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-all"
                                        >
                                            <MoreHorizontal size={14} className="text-gray-500" />
                                        </button>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="ml-4 mt-1 space-y-1 border-l border-white/5 pl-2">
                                            {/* Tasks Section */}
                                            <div>
                                                <button
                                                    onClick={() => toggleSection(project.id, 'tasks')}
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-300 hover:bg-white/5 rounded transition-all"
                                                >
                                                    <CheckSquare size={12} />
                                                    <span className="flex-1 text-left">Tareas</span>
                                                    <span className="text-aura-accent font-bold">{project.tasks.length}</span>
                                                    <ChevronDown
                                                        size={12}
                                                        className={`transition-transform ${projectSections.has('tasks') ? 'rotate-180' : ''}`}
                                                    />
                                                </button>
                                                {projectSections.has('tasks') && (
                                                    <div className="ml-4 space-y-0.5 mt-1">
                                                        {project.tasks.slice(0, 5).map(task => (
                                                            <button
                                                                key={task.id}
                                                                onClick={() => onSelectTask(task)}
                                                                className="w-full text-left px-2 py-1 text-xs text-gray-500 hover:text-white hover:bg-white/5 rounded truncate flex items-center gap-2"
                                                            >
                                                                <div className={`w-2 h-2 rounded-full ${task.status === 'done' ? 'bg-aura-accent' : 'border border-gray-500'}`} />
                                                                {task.title}
                                                            </button>
                                                        ))}
                                                        {project.tasks.length > 5 && (
                                                            <p className="text-[10px] text-gray-600 px-2">+{project.tasks.length - 5} más</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Notes Section */}
                                            <div>
                                                <button
                                                    onClick={() => toggleSection(project.id, 'notes')}
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-300 hover:bg-white/5 rounded transition-all"
                                                >
                                                    <FileText size={12} />
                                                    <span className="flex-1 text-left">Notas</span>
                                                    <span className="text-aura-accent font-bold">{project.notes.length}</span>
                                                    <ChevronDown
                                                        size={12}
                                                        className={`transition-transform ${projectSections.has('notes') ? 'rotate-180' : ''}`}
                                                    />
                                                </button>
                                                {projectSections.has('notes') && (
                                                    <div className="ml-4 space-y-0.5 mt-1">
                                                        {project.notes.slice(0, 5).map(note => (
                                                            <button
                                                                key={note.id}
                                                                onClick={() => onSelectNote(note)}
                                                                className="w-full text-left px-2 py-1 text-xs text-gray-500 hover:text-white hover:bg-white/5 rounded truncate flex items-center gap-2"
                                                            >
                                                                <span>📝</span>
                                                                {note.title}
                                                            </button>
                                                        ))}
                                                        {project.notes.length > 5 && (
                                                            <p className="text-[10px] text-gray-600 px-2">+{project.notes.length - 5} más</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Contacts Section */}
                                            <div>
                                                <button
                                                    onClick={() => toggleSection(project.id, 'contacts')}
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-300 hover:bg-white/5 rounded transition-all"
                                                >
                                                    <Users size={12} />
                                                    <span className="flex-1 text-left">Contactos</span>
                                                    <span className="text-aura-accent font-bold">{project.contacts.length}</span>
                                                    <ChevronDown
                                                        size={12}
                                                        className={`transition-transform ${projectSections.has('contacts') ? 'rotate-180' : ''}`}
                                                    />
                                                </button>
                                                {projectSections.has('contacts') && (
                                                    <div className="ml-4 space-y-0.5 mt-1">
                                                        {project.contacts.slice(0, 5).map(contact => (
                                                            <button
                                                                key={contact.id}
                                                                onClick={() => onSelectContact(contact)}
                                                                className="w-full text-left px-2 py-1 text-xs text-gray-500 hover:text-white hover:bg-white/5 rounded truncate flex items-center gap-2"
                                                            >
                                                                <div className="w-4 h-4 rounded-full bg-aura-accent/20 flex items-center justify-center text-[8px] text-aura-accent font-bold">
                                                                    {contact.name.charAt(0)}
                                                                </div>
                                                                {contact.name}
                                                            </button>
                                                        ))}
                                                        {project.contacts.length > 5 && (
                                                            <p className="text-[10px] text-gray-600 px-2">+{project.contacts.length - 5} más</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/5 text-center">
                    <p className="text-[10px] text-gray-600">
                        {projects.length} proyectos • {tasks.length} tareas
                    </p>
                </div>
            </aside>
        </>
    );
};

export default ProjectsSidebar;
