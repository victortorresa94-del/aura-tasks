import React from 'react';
import {
  Check, Phone, MapPin, Music, DollarSign, Calendar,
  Play, Navigation, CalendarDays
} from 'lucide-react';
import { Task, Project, TaskStatus } from '../types';

interface TaskItemProps {
  task: Task;
  list?: Project;
  statuses?: TaskStatus[]; // New Prop
  onToggle: (id: string) => void;
  onClick: (task: Task) => void;
  density?: 'compact' | 'comfortable';
}

const TaskItem: React.FC<TaskItemProps> = ({ task, list, statuses, onToggle, onClick, density = 'comfortable' }) => {
  const isCompact = density === 'compact';

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
    <div
      onClick={() => onClick(task)}
      className={`
        group relative flex items-start gap-3 bg-aura-gray/20 rounded-xl border border-white/5 
        shadow-sm hover:bg-aura-gray/40 hover:border-white/10 transition-all cursor-pointer select-none active:scale-[0.99]
        ${isCompleted ? 'opacity-50' : ''}
        ${isCompact ? 'p-3 items-center' : 'p-4'}
      `}
    >
      {/* Checkbox / Status Indicator */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
        className={`
          flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors
          ${isCompact ? 'w-5 h-5' : 'w-5 h-5 mt-1'}
          ${isCompleted
            ? 'bg-aura-accent border-aura-accent text-aura-black'
            : `border-gray-500 hover:border-aura-accent`}
        `}
      >
        {isCompleted && <Check size={12} strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        {/* Top Row: Title & Actions */}
        <div className="flex items-center justify-between">
          <h3 className={`font-medium text-aura-white truncate pr-2 ${isCompleted ? 'line-through text-gray-500' : ''} ${isCompact ? 'text-sm' : ''}`}>
            {task.title}
          </h3>

          {/* Action Button: Visible on Mobile, Hover on Desktop */}
          {task.type !== 'normal' && !isCompact && (
            <button
              onClick={handleAction}
              className="ml-2 p-1.5 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 hover:text-aura-white transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              {task.type === 'call' && <Phone size={16} />}
              {task.type === 'shopping' && <MapPin size={16} />}
              {task.type === 'music' && <Play size={16} />}
              {task.type === 'payment' && <DollarSign size={16} />}
            </button>
          )}
        </div>

        {/* Bottom Row: Metadata (Hidden in Compact if no critical info) */}
        <div className={`flex flex-wrap items-center gap-2 ${isCompact ? 'mt-1' : 'mt-1.5'}`}>
          {!isCompact && list && (
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
              <span className={list.color}>{list.icon}</span> {list.name}
            </span>
          )}

          {/* Status Badge */}
          {!isCompact && statusObj && !isCompleted && (
            <span className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded text-white transform scale-90 origin-left`}
              style={{ backgroundColor: statusObj.color.startsWith('bg-') ? undefined : statusObj.color }} // Handle if color is hex or class
            >
              <span className={`w-1.5 h-1.5 rounded-full bg-white`}></span>
              {statusObj.name}
            </span>
          )}

          {/* Priority (Dot in compact, Label in comfortable) */}
          {isCompact ? (
            <div className={`w-2 h-2 rounded-full ${task.priority === 'alta' ? 'bg-red-500' : task.priority === 'media' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          ) : (
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${task.priority === 'alta' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                task.priority === 'media' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
              {task.priority}
            </span>
          )}

          {/* Date */}
          {task.date && !isCompact && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar size={12} />
              {new Date(task.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
            </span>
          )}

          {/* Event Badge (Always shown if present) */}
          {task.eventDate && (
            <span className={`flex items-center gap-1 font-bold text-purple-400 bg-purple-500/10 rounded border border-purple-500/20 ${isCompact ? 'text-[9px] px-1.5' : 'text-[10px] px-2 py-0.5'}`}>
              <CalendarDays size={isCompact ? 10 : 12} />
              {isCompact ? 'Evento' : `Evento: ${new Date(task.eventDate).toLocaleDateString('es-ES', { weekday: 'short' })}`}
            </span>
          )}
        </div>

        {/* Context Preview (Only Comfortable) */}
        {!isCompact && task.type === 'call' && task.contactName && (
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Phone size={12} className="text-gray-500" /> Llamar a <span className="text-gray-300">{task.contactName}</span>
          </p>
        )}
        {!isCompact && task.type === 'shopping' && task.locationName && (
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <MapPin size={12} className="text-gray-500" /> Ir a <span className="text-gray-300">{task.locationName}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default TaskItem;