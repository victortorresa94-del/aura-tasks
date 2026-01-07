import React from 'react';
import {
  Check, Phone, MapPin, Music, DollarSign, Calendar,
  Play, Navigation, CalendarDays, ListTodo, ChevronDown
} from 'lucide-react';
import { Task, Project, TaskStatus } from '../types';

interface TaskItemProps {
  task: Task;
  list?: Project;
  statuses?: TaskStatus[]; // New Prop
  onToggle: (id: string) => void;
  onClick: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  density?: 'compact' | 'comfortable';
}

const TaskItem: React.FC<TaskItemProps> = ({ task, list, statuses, onToggle, onClick, onUpdateTask, density = 'comfortable' }) => {
  const isCompact = density === 'compact';
  const [showSubtasks, setShowSubtasks] = React.useState(false);

  // Resolve Status
  const statusObj = statuses?.find(s => s.id === task.status);
  const isCompleted = statusObj?.isCompleted || false;
  const statusColor = statusObj?.color || 'bg-gray-300';

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'alta': return 'bg-red-50 text-red-600 border-red-100';
      case 'media': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'baja': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.type === 'call' && task.phoneNumber) {
      window.open(`tel:${task.phoneNumber}`);
    } else if (task.type === 'shopping' && task.locationName) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(task.locationName)}`, '_blank');
    } else if (task.type === 'music' && task.spotifyUrl) {
      window.open(task.spotifyUrl, '_blank');
    }
  };

  const activeSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0;

  const toggleSubtask = (e: React.MouseEvent, subId: string) => {
    e.stopPropagation();
    if (!onUpdateTask || !task.subtasks) return;
    const newSubtasks = task.subtasks.map(s => s.id === subId ? { ...s, isCompleted: !s.isCompleted } : s);
    onUpdateTask({ ...task, subtasks: newSubtasks });
  };

  // Special rendering for Events
  if (task.type === 'event') {
    return (
      <div
        onClick={() => onClick(task)}
        className={`group relative flex items-center gap-4 ${isCompact ? 'p-3' : 'p-4'} bg-gradient-to-r from-purple-900/20 to-aura-gray rounded-xl border border-purple-500/20 shadow-sm transition-all cursor-pointer hover:border-purple-500/40`}
      >
        <div className={`${isCompact ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-500/20`}>
          <CalendarDays size={isCompact ? 16 : 20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-aura-white ${isCompact ? 'text-sm' : ''}`}>{task.title}</h3>
          {!isCompact && (
            <p className="text-xs text-purple-300 font-medium mt-0.5">
              {new Date(task.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (

    <div className="flex flex-col gap-1">
      <div
        onClick={() => onClick(task)}
        className={`
        group relative flex items-center gap-3 py-2 px-3
        bg-aura-gray/20 rounded-xl border border-white/5 
        hover:bg-aura-gray/40 hover:border-white/10 transition-all cursor-pointer select-none
        ${isCompleted ? 'opacity-60' : ''}
      `}
      >
        {/* DRAG HANDLE (Visible on Hover in Desktop) */}
        <div className="hidden md:flex opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 p-1 flex-shrink-0">
          <div className="flex flex-col gap-0.5">
            <div className="flex gap-0.5"><div className="w-0.5 h-0.5 bg-current rounded-full" /><div className="w-0.5 h-0.5 bg-current rounded-full" /></div>
            <div className="flex gap-0.5"><div className="w-0.5 h-0.5 bg-current rounded-full" /><div className="w-0.5 h-0.5 bg-current rounded-full" /></div>
            <div className="flex gap-0.5"><div className="w-0.5 h-0.5 bg-current rounded-full" /><div className="w-0.5 h-0.5 bg-current rounded-full" /></div>
          </div>
        </div>

        {/* CHECKBOX */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          className={`
          flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
          ${isCompleted
              ? 'bg-aura-accent border-aura-accent text-aura-black'
              : `border-gray-500 hover:border-aura-accent hover:bg-white/5`}
        `}
        >
          {isCompleted && <Check size={10} strokeWidth={4} />}
        </button>

        {/* TITLE & TAGS */}
        <div className="flex-1 min-w-0 flex items-center gap-3 mr-4">
          <span className={`text-sm text-gray-200 font-medium truncate ${isCompleted ? 'line-through text-gray-500' : ''}`}>
            {task.title}
          </span>

          {/* Subtasks Indicator (Small) */}
          {activeSubtasks > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowSubtasks(!showSubtasks); }}
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-aura-white bg-white/5 px-1.5 py-0.5 rounded transition-colors"
              title={`${completedSubtasks}/${activeSubtasks} Subtareas`}
            >
              <ListTodo size={10} />
              <span>{completedSubtasks}/{activeSubtasks}</span>
            </button>
          )}

          {/* List Tag (if present) */}
          {list && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded text-gray-500 bg-white/5 border border-white/5">
              <span className={`w-1.5 h-1.5 rounded-full ${list.color.replace('text-', 'bg-').replace('border-', '')}`} />
              <span className="uppercase tracking-wider">{list.name}</span>
            </span>
          )}
        </div>

        {/* COLUMNS (Desktop) */}
        <div className="hidden md:flex items-center gap-6 text-xs text-gray-400 flex-shrink-0">

          {/* DATE */}
          <div className="w-24 flex justify-end">
            {task.date ? (
              <span className={`hover:text-aura-white transition-colors cursor-pointer ${task.date < new Date().toISOString().split('T')[0] ? 'text-red-400' : ''}`}>
                {new Date(task.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
              </span>
            ) : (
              <span className="opacity-0 group-hover:opacity-30 hover:!opacity-100 cursor-pointer transition-opacity text-[10px] uppercase font-bold text-gray-500">Fecha</span>
            )}
          </div>

          {/* PRIORITY */}
          <div className="w-20 flex justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!onUpdateTask) return;
                const nextP = task.priority === 'baja' ? 'media' : task.priority === 'media' ? 'alta' : 'baja';
                onUpdateTask({ ...task, priority: nextP });
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 transition-colors uppercase text-[10px] font-bold tracking-wider
                   ${task.priority === 'alta' ? 'text-red-400' : task.priority === 'media' ? 'text-amber-400' : 'text-emerald-400'}
                `}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${task.priority === 'alta' ? 'bg-red-500' : task.priority === 'media' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {task.priority}
            </button>
          </div>

          {/* STATUS */}
          <div className="w-28 flex justify-end">
            {statuses && statusObj ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!onUpdateTask) return;
                  const currentIndex = statuses.findIndex(s => s.id === task.status);
                  const nextIndex = (currentIndex + 1) % statuses.length;
                  onUpdateTask({ ...task, status: statuses[nextIndex].id });
                }}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors uppercase text-[10px] font-bold text-white max-w-full"
                style={{ backgroundColor: statusObj.color.startsWith('bg-') ? undefined : `${statusObj.color}20`, color: statusObj.color.startsWith('bg-') ? undefined : statusObj.color }}
              >
                <div className={`w-1.5 h-1.5 rounded-sm ${statusObj.color.startsWith('bg-') ? statusObj.color : ''}`} style={{ backgroundColor: statusObj.color.startsWith('bg-') ? undefined : statusObj.color }} />
                <span className="truncate">{statusObj.name}</span>
              </button>
            ) : (
              <div className="w-2 h-2 rounded-full bg-gray-600" />
            )}
          </div>
        </div>

        {/* MOBILE METADATA (Compact only logic) */}
        {!isCompact && (
          <div className="md:hidden flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${task.priority === 'alta' ? 'bg-red-500' : task.priority === 'media' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {task.date && <span className="text-[10px] text-gray-500">{new Date(task.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</span>}
          </div>
        )}

      </div>

      {/* SUBTASKS LIST */}
      {showSubtasks && task.subtasks && (
        <div className="ml-10 md:ml-12 border-l border-white/10 pl-2 space-y-0.5 mb-2 animate-fade-in-up">
          {task.subtasks.map(sub => (
            <div key={sub.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded transition-colors group/sub">
              <button
                onClick={(e) => toggleSubtask(e, sub.id)}
                className={`flex-shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${sub.isCompleted ? 'bg-aura-accent border-aura-accent text-aura-black' : 'border-gray-600 hover:border-gray-400'}`}
              >
                {sub.isCompleted && <Check size={8} strokeWidth={3} />}
              </button>
              <span className={`text-xs ${sub.isCompleted ? 'line-through text-gray-600' : 'text-gray-400'} flex-1`}>{sub.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskItem;