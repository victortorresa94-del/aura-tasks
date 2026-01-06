import React from 'react';
import { Task, Note, Project } from '../../types';
import { CheckCircle2, StickyNote, BarChart3, Clock } from 'lucide-react';

// --- Widget Types ---
export type WidgetType = 'tasks_list' | 'note_sticky' | 'stats_summary' | 'clock';

export interface WidgetData {
    id: string;
    type: WidgetType;
    title?: string;
    props?: Record<string, any>;
}

// --- Specific Widget Components ---

const TasksWidget = ({ tasks, title }: { tasks: Task[], title?: string }) => (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center handle cursor-move">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-indigo-500" />
                {title || 'Mis Tareas'}
            </h3>
            <span className="text-xs text-gray-400">{tasks.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {tasks.length === 0 && <p className="text-xs text-gray-400 text-center mt-4">No hay tareas pendientes.</p>}
            {tasks.slice(0, 10).map(t => (
                <div key={t.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg group">
                    <div className={`w-4 h-4 rounded-full border-2 ${t.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-300'} flex-shrink-0`} />
                    <span className={`text-xs truncate ${t.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{t.title}</span>
                </div>
            ))}
        </div>
    </div>
);

const NoteWidget = ({ note }: { note?: Note }) => (
    <div className="h-full flex flex-col bg-yellow-50/80 rounded-2xl shadow-sm border border-yellow-100 overflow-hidden relative group">
        <div className="p-3 flex justify-between items-center handle cursor-move absolute top-0 left-0 right-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-yellow-100/50 backdrop-blur-sm">
            <h3 className="text-xs font-bold text-yellow-800 flex items-center gap-2">
                <StickyNote size={14} />
                Nota Rápida
            </h3>
        </div>
        <div className="flex-1 p-4 pt-8 font-handwriting text-gray-800 text-sm overflow-y-auto">
            {note ? (
                <>
                    <h4 className="font-bold mb-2">{note.title}</h4>
                    <p className="whitespace-pre-wrap">{note.content || 'Sin contenido...'}</p>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-yellow-800/50">
                    <StickyNote size={24} className="mb-2" />
                    <p>Selecciona una nota</p>
                </div>
            )}
        </div>
    </div>
);

const StatsWidget = ({ completed, pending }: { completed: number, pending: number }) => (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center handle cursor-move">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <BarChart3 size={16} className="text-pink-500" />
                Resumen
            </h3>
        </div>
        <div className="flex-1 flex items-center justify-center gap-4 p-2">
            <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{completed}</p>
                <p className="text-[10px] uppercase font-bold text-gray-400">Hechas</p>
            </div>
            <div className="w-px h-8 bg-gray-100"></div>
            <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{pending}</p>
                <p className="text-[10px] uppercase font-bold text-gray-400">Pendientes</p>
            </div>
        </div>
    </div>
);

const ClockWidget = () => (
    <div className="h-full flex flex-col items-center justify-center bg-gray-900 text-white rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 pointer-events-none"></div>
        <div className="handle w-full h-full absolute inset-0 cursor-move z-10"></div>
        <Clock size={32} className="mb-2 text-indigo-400" />
        <p className="text-2xl font-bold font-mono">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-xs text-gray-400 font-medium">
            {new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}
        </p>
    </div>
);


// --- Registry Factory ---

export const renderWidget = (widget: WidgetData, data: any) => {
    const { tasks, notes } = data;

    switch (widget.type) {
        case 'tasks_list':
            // Filter tasks if needed based on widget.props.filter
            const filteredTasks = widget.props?.filter === 'today'
                ? tasks.filter((t: Task) => t.date === new Date().toISOString().split('T')[0])
                : tasks.filter((t: Task) => !t.status || t.status !== 'done');
            return <TasksWidget tasks={filteredTasks} title={widget.props?.title} />;

        case 'note_sticky':
            const note = widget.props?.noteId ? notes.find((n: Note) => n.id === widget.props?.noteId) : notes[0];
            return <NoteWidget note={note} />;

        case 'stats_summary':
            const completed = tasks.filter((t: Task) => t.status === 'done').length;
            const pending = tasks.filter((t: Task) => t.status !== 'done').length;
            return <StatsWidget completed={completed} pending={pending} />;

        case 'clock':
            return <ClockWidget />;

        default:
            return <div className="p-4 bg-red-50 text-red-500 text-xs rounded-xl">Widget desconocido: {widget.type}</div>;
    }
};
