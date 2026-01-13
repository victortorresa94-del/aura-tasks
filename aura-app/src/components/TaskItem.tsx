
import React, { useState, useRef, useEffect } from 'react';
import {
  Check, ListTodo, Calendar, Flag, Link as LinkIcon, AlertCircle, FileText, CheckCircle, ChevronDown, PieChart, Euro
} from 'lucide-react';
import { Task, Project, TaskStatus, Priority } from '../types';
import { getColumnDef } from '../utils/columnDefs';
import DatePicker from './DatePicker';
import { createPortal } from 'react-dom';

interface TaskItemProps {
  task: Task;
  list?: Project;
  statuses?: TaskStatus[];
  onToggle: (id: string) => void;
  onClick: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  density?: 'compact' | 'comfortable';
  visibleColumns?: string[];
  columnWidths?: Record<string, number>;
}

const FixedPopover = ({ children, triggerRef, onClose }: { children: React.ReactNode, triggerRef: React.RefObject<HTMLElement>, onClose: () => void }) => {
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Align right edge of popover with right edge of trigger, or center
      const popoverWidth = 250;
      let left = rect.right - popoverWidth;
      let top = rect.bottom + 5;

      // Basic screen boundary checks
      if (left + popoverWidth > window.innerWidth) left = window.innerWidth - popoverWidth - 10;
      if (left < 10) left = 10;
      if (top + 300 > window.innerHeight) top = rect.top - 310; // Flip up if bottom space is tight

      setCoords({ top, left });
    }
  }, [triggerRef]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        className="fixed z-[9999] animate-scale-in origin-top-right"
        style={{ top: coords.top, left: coords.left }}
      >
        {children}
      </div>
    </>,
    document.body
  );
};

const TaskItem: React.FC<TaskItemProps> = ({
  task, list, statuses, onToggle, onClick, onUpdateTask, density = 'comfortable', visibleColumns, columnWidths
}) => {
  const isCompact = density === 'compact';
  const [showSubtasks, setShowSubtasks] = useState(false);

  // Interaction State
  const [editingCell, setEditingCell] = useState<string | null>(null);

  // Resolution
  const statusObj = statuses?.find(s => s.id === task.status);
  const isCompleted = statusObj?.isCompleted || false;
  const activeSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0;

  // Handlers
  const handleCellClick = (e: React.MouseEvent, colId: string) => {
    e.stopPropagation();
    if (editingCell === colId) {
      setEditingCell(null);
    } else {
      setEditingCell(colId);
    }
  };

  const activeTriggerRef = useRef<HTMLButtonElement>(null);

  const handleUpdate = (updates: Partial<Task>) => {
    if (onUpdateTask) {
      onUpdateTask({ ...task, ...updates });
    }
    setEditingCell(null);
  };

  const handleCustomUpdate = (key: string, value: any) => {
    const current = task.customValues || {};
    handleUpdate({ customValues: { ...current, [key]: value } });
  };

  const closeEditor = () => setEditingCell(null);

  // Cell Renderers
  const renderCell = (colId: string, width: number) => {
    const def = getColumnDef(colId);
    if (!def) return null;

    const isEditing = editingCell === colId;

    // --- STATUS ---
    if (colId === 'status') {
      return (
        <div className="flex justify-end pr-2" style={{ width }}>
          <button
            ref={isEditing ? activeTriggerRef : undefined}
            onClick={(e) => handleCellClick(e, colId)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors uppercase text-[10px] font-bold text-white max-w-full truncate"
            style={{ backgroundColor: statusObj?.color?.startsWith('bg-') ? undefined : `${statusObj?.color}20`, color: statusObj?.color?.startsWith('bg-') ? undefined : statusObj?.color }}
          >
            <div className={`w-1.5 h-1.5 rounded-sm shrink-0 ${statusObj?.color?.startsWith('bg-') ? statusObj.color : ''}`} style={{ backgroundColor: statusObj?.color?.startsWith('bg-') ? undefined : statusObj?.color }} />
            <span className="truncate">{statusObj?.name || 'Estado'}</span>
          </button>

          {isEditing && statuses && (
            <FixedPopover triggerRef={activeTriggerRef} onClose={closeEditor}>
              <div className="w-40 bg-aura-gray border border-white/10 rounded-xl shadow-2xl p-1 flex flex-col gap-0.5">
                {statuses.map(s => (
                  <button
                    key={s.id}
                    onClick={(e) => { e.stopPropagation(); handleUpdate({ status: s.id }); }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 flex items-center gap-2 text-xs text-gray-300 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full ${s.color}`}></div>
                    {s.name}
                  </button>
                ))}
              </div>
            </FixedPopover>
          )}
        </div>
      );
    }

    // --- PRIORITY ---
    if (colId === 'priority') {
      const pColors = { alta: 'text-red-400', media: 'text-amber-400', baja: 'text-emerald-400' };
      return (
        <div className="flex justify-center pr-2" style={{ width }}>
          <button
            ref={isEditing ? activeTriggerRef : undefined}
            onClick={(e) => handleCellClick(e, colId)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/5 transition-colors uppercase text-[10px] font-bold tracking-wider ${pColors[task.priority]}`}
          >
            <Flag size={12} fill="currentColor" />
            {task.priority}
          </button>

          {isEditing && (
            <FixedPopover triggerRef={activeTriggerRef} onClose={closeEditor}>
              <div className="w-32 bg-aura-gray border border-white/10 rounded-xl shadow-2xl p-1 flex flex-col gap-0.5">
                {(['alta', 'media', 'baja'] as Priority[]).map(p => (
                  <button
                    key={p}
                    onClick={(e) => { e.stopPropagation(); handleUpdate({ priority: p }); }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 flex items-center gap-2 text-xs font-bold uppercase ${pColors[p]}`}
                  >
                    <Flag size={12} /> {p}
                  </button>
                ))}
              </div>
            </FixedPopover>
          )}
        </div>
      );
    }

    // --- DATE ---
    if (colId === 'date') {
      const isLate = task.date && task.date < new Date().toISOString().split('T')[0];
      return (
        <div className="flex justify-end pr-2" style={{ width }}>
          <button
            ref={isEditing ? activeTriggerRef : undefined}
            onClick={(e) => handleCellClick(e, colId)}
            className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded hover:bg-white/5 transition-colors truncate ${isLate ? 'text-red-400 font-bold' : 'text-gray-400 hover:text-white'}`}
          >
            {task.date ? new Date(task.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : <span className="opacity-50">Sin fecha</span>}
            <Calendar size={12} className={task.date ? "opacity-50" : ""} />
          </button>

          {isEditing && (
            <FixedPopover triggerRef={activeTriggerRef} onClose={closeEditor}>
              <div className="bg-aura-gray border border-white/10 rounded-xl shadow-2xl">
                <DatePicker
                  currentDate={task.date}
                  onChange={(d) => handleUpdate({ date: d })}
                  onClose={closeEditor}
                />
              </div>
            </FixedPopover>
          )}
        </div>
      );
    }

    // --- PROGRESS (Percentage) ---
    if (colId === 'progress') {
      const val = (task.customValues && task.customValues['progress']) || 0;
      return (
        <div className="flex justify-center pr-2" style={{ width }}>
          <button
            ref={isEditing ? activeTriggerRef : undefined}
            onClick={(e) => handleCellClick(e, colId)}
            className="relative w-full h-4 bg-white/5 rounded-full overflow-hidden hover:ring-1 hover:ring-white/20"
          >
            <div className="absolute inset-y-0 left-0 bg-aura-accent/30" style={{ width: `${val}%` }} />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white z-10">{val}%</span>
          </button>

          {isEditing && (
            <FixedPopover triggerRef={activeTriggerRef} onClose={closeEditor}>
              <div className="w-48 bg-aura-gray border border-white/10 rounded-xl p-3 shadow-xl">
                <label className="text-xs text-gray-400 block mb-2 font-bold">Progreso: {val}%</label>
                <input
                  type="range" min="0" max="100" step="10"
                  value={val}
                  onChange={(e) => handleCustomUpdate('progress', parseInt(e.target.value))}
                  className="w-full accent-aura-accent"
                />
              </div>
            </FixedPopover>
          )}
        </div>
      )
    }

    // --- LINK ---
    if (colId === 'link' || colId === 'attachments') { // Treating attachments as generic link/text for now
      const val = (task.customValues && task.customValues[colId]) || '';
      return (
        <div className="flex justify-end pr-2" style={{ width }}>
          {val ? (
            <div className="flex items-center gap-1">
              <a href={val} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-aura-accent hover:underline text-xs truncate max-w-[80px]">Link</a>
              <button onClick={(e) => handleCellClick(e, colId)} ref={isEditing ? activeTriggerRef : undefined} className="p-1 hover:bg-white/10 rounded text-gray-400">
                <LinkIcon size={12} />
              </button>
            </div>
          ) : (
            <button
              ref={isEditing ? activeTriggerRef : undefined}
              onClick={(e) => handleCellClick(e, colId)}
              className="text-gray-600 hover:text-gray-400"
            >
              <LinkIcon size={14} />
            </button>
          )}

          {isEditing && (
            <FixedPopover triggerRef={activeTriggerRef} onClose={closeEditor}>
              <div className="w-64 bg-aura-gray border border-white/10 rounded-xl p-2 shadow-xl">
                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleCustomUpdate(colId, fd.get('url')); closeEditor(); }}>
                  <input name="url" defaultValue={val} placeholder="https://..." className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs text-white mb-2" autoFocus />
                  <button className="w-full bg-aura-accent text-black text-xs font-bold py-1.5 rounded">Guardar</button>
                </form>
              </div>
            </FixedPopover>
          )}
        </div>
      )
    }


    // --- GENERIC FALLBACK ---
    const val = (task.customValues && task.customValues[colId]) || (task as any)[colId];
    return (
      <div className="flex justify-end pr-2" style={{ width }}>
        {isEditing ? (
          <input
            autoFocus
            defaultValue={val}
            onBlur={(e) => { handleCustomUpdate(colId, e.target.value); closeEditor(); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { handleCustomUpdate(colId, e.currentTarget.value); closeEditor(); } }}
            className="w-full bg-black/50 border border-aura-accent rounded px-1 py-0.5 text-xs text-white outline-none"
          />
        ) : (
          <span onClick={(e) => handleCellClick(e, colId)} className="text-xs text-gray-400 truncate cursor-text hover:text-white transition-colors block w-full text-right h-5">
            {val ? String(val) : ''}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1 w-full relative">
      <div
        onClick={() => onClick(task)}
        className={`group relative flex items-center gap-3 py-2 px-3 bg-aura-gray/20 rounded-xl border border-white/5 hover:bg-aura-gray/40 hover:border-white/10 transition-all cursor-pointer select-none ${isCompleted ? 'opacity-60' : ''}`}
      >
        {/* CHECKBOX */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle(task.id);
          }}
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all z-20 ${isCompleted ? 'bg-aura-accent border-aura-accent text-aura-black' : 'border-gray-500 hover:border-aura-accent hover:bg-white/5'}`}
        >
          {isCompleted && <Check size={10} strokeWidth={4} />}
        </button>

        {/* TITLE SECTION (Always First, flex-1) */}
        <div className="flex-1 min-w-0 flex items-center gap-3 mr-4">
          <span className={`text-sm text-gray-200 font-medium truncate ${isCompleted ? 'line-through text-gray-500' : ''}`}>
            {task.title}
          </span>
          {activeSubtasks > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowSubtasks(!showSubtasks); }}
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-aura-white bg-white/5 px-1.5 py-0.5 rounded transition-colors"
            >
              <ListTodo size={10} />
              <span>{completedSubtasks}/{activeSubtasks}</span>
            </button>
          )}
        </div>

        {/* DYNAMIC COLUMNS (Desktop Only - Hidden on Mobile) */}
        <div className="hidden md:flex items-center">
          {visibleColumns?.map(colId => {
            if (colId === 'title') return null;
            const def = getColumnDef(colId);
            if (!def) return null;

            const width = (columnWidths && columnWidths[colId]) || def.minWidth;

            return (
              <div key={colId} className="flex-shrink-0 border-l border-white/5 pl-2 h-4 items-center flex">
                {renderCell(colId, width)}
              </div>
            );
          })}
          {/* Spacer for Action/Plus column match */}
          <div className="w-8"></div>
        </div>

        {/* MOBILE FALLBACK */}
        <div className="md:hidden flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${task.priority === 'alta' ? 'bg-red-500' : task.priority === 'media' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          {task.date && <span className="text-[10px] text-gray-500">{new Date(task.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</span>}
        </div>

      </div>

      {/* SUBTASKS */}
      {showSubtasks && task.subtasks && (
        <div className="ml-10 md:ml-12 border-l border-white/10 pl-2 space-y-0.5 mb-2 animate-fade-in-up">
          {task.subtasks.map(sub => (
            <div key={sub.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded transition-colors group/sub">
              <button className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${sub.isCompleted ? 'bg-aura-accent border-aura-accent text-aura-black' : 'border-gray-600'}`}>
                {sub.isCompleted && <Check size={8} strokeWidth={3} />}
              </button>
              <span className={`text-xs ${sub.isCompleted ? 'line-through text-gray-600' : 'text-gray-400'}`}>{sub.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskItem;