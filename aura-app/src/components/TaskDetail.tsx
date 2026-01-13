
import React, { useState, useRef } from 'react';
import {
  X, Calendar, Flag, Tag, Trash2, Clock, MapPin, Phone,
  Music, AlignLeft, CheckSquare, ChevronDown, StickyNote, ArrowRight, Plus, Check, Loader, Trophy, ListTodo
} from 'lucide-react';
import { Task, Project, Priority, Note, Contact, FileItem, LinkedItem, TaskStatus, SubTask } from '../types';
import DatePicker from './DatePicker';
import LinkManager from './LinkManager';
import { parseDateFromText } from '../utils/auraLogic';
import { createPortal } from 'react-dom';
import { AVAILABLE_COLUMNS, getColumnDef } from '../utils/columnDefs';

interface TaskDetailProps {
  task: Task;
  lists: Project[];
  statuses?: TaskStatus[];
  notes: Note[];
  contacts: Contact[];
  files: FileItem[];
  allTasks: Task[];
  visibleColumns?: string[]; // New Prop
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
  onCreateNote?: (taskId: string, title: string) => void;
  onNavigateToNote?: (noteId: string) => void;
  onAddTab: (label: string, type: 'view' | 'project' | 'entity' | 'note' | 'task' | 'contact', data: any, path: string) => void;
}

const FixedPopover = ({ children, triggerRef, onClose }: { children: React.ReactNode, triggerRef: React.RefObject<HTMLElement>, onClose: () => void }) => {
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Logic for bottom-sheet style or popover
      // For this detail view, popping UP is usually better if at bottom
      // Let's check available space
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top = 0;
      let left = rect.left;

      if (spaceBelow > 300) {
        top = rect.bottom + 5;
      } else {
        top = rect.top - 5; // Will need to translate Y -100% in CSS or calculate height. 
        // Since we don't know height, let's just stick to "above" logic being handled by CSS or fixed calc?
        // Simplest for now: Align bottom of popover with top of trigger? 
        // CSS 'bottom: ...' is easier if we use Fixed positioning relative to window bottom? No.
        // Let's use top and translate-y if needed. 
        // Actually, let's keep it simple: Attempt to render above if space below is tight.
      }

      // Basic fallback: render at rect.bottom (dropdown) unless strict requirement. 
      // User complaint was likely clipping.
      // Let's try to mimic the original "bottom-full" intent but fixed.
      // If we want "bottom-full", that means the bottom of the popover is at rect.top.

      const popoverStyle: any = { left: rect.left };
      if (spaceBelow < 300) {
        popoverStyle.bottom = window.innerHeight - rect.top + 5;
      } else {
        popoverStyle.top = rect.bottom + 5;
      }

      // Boundary check left
      if (left + 250 > window.innerWidth) popoverStyle.left = window.innerWidth - 260;

      setCoords(popoverStyle);
    }
  }, [triggerRef]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        className="fixed z-[9999] animate-scale-in origin-bottom-left"
        style={coords}
      >
        {children}
      </div>
    </>,
    document.body
  );
};

const TaskDetail: React.FC<TaskDetailProps> = ({
  task, lists, statuses, notes, contacts, files, allTasks, visibleColumns, onClose, onUpdate, onDelete, onCreateNote, onNavigateToNote, onAddTab
}) => {
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const projectBtnRef = useRef<HTMLButtonElement>(null);
  const dateBtnRef = useRef<HTMLButtonElement>(null);
  const priorityBtnRef = useRef<HTMLButtonElement>(null);

  const isNew = !allTasks.find(t => t.id === task.id);
  const currentStatus = statuses?.find(s => s.id === editedTask.status);

  const updateField = (field: keyof Task, value: any) => {
    const updated = { ...editedTask, [field]: value };
    setEditedTask(updated);
  };

  const handleUpdateLinks = (newLinks: LinkedItem[]) => {
    updateField('links', newLinks);
  };

  const handleSave = () => {
    if (!editedTask.title.trim()) return;
    let finalTask = { ...editedTask };
    if (isNew) {
      const { title: cleanTitle, date: nlpDate } = parseDateFromText(editedTask.title);
      finalTask.title = cleanTitle;
      if (nlpDate) finalTask.date = nlpDate;
    }
    onUpdate(finalTask);
    onClose();
  };

  // --- Subtasks Logic ---
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const subtask: SubTask = {
      id: Date.now().toString(),
      title: newSubtaskTitle,
      isCompleted: false
    };
    const updatedSubtasks = [...(editedTask.subtasks || []), subtask];
    updateField('subtasks', updatedSubtasks);
    setNewSubtaskTitle('');
  };

  const toggleSubtask = (id: string) => {
    const updatedSubtasks = (editedTask.subtasks || []).map(s =>
      s.id === id ? { ...s, isCompleted: !s.isCompleted } : s
    );
    updateField('subtasks', updatedSubtasks);
  };

  const handleDeleteSubtask = (id: string) => {
    const updatedSubtasks = (editedTask.subtasks || []).filter(s => s.id !== id);
    updateField('subtasks', updatedSubtasks);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full h-[85vh] sm:h-auto sm:max-h-[85vh] sm:max-w-3xl bg-[#0f0f0f] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col animate-slide-up ring-1 ring-white/5 pb-0 overflow-hidden">

        {/* Header - Minimal */}
        <div className="px-6 pt-6 pb-2 shrink-0">
          <input
            autoFocus={isNew}
            type="text"
            value={editedTask.title}
            onChange={(e) => updateField('title', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full text-xl font-bold text-aura-white border-none p-0 focus:ring-0 placeholder:text-gray-600 bg-transparent leading-relaxed"
            placeholder="¿Qué hay que hacer?"
          />
          <textarea
            value={editedTask.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Descripción"
            rows={1}
            className="w-full text-sm text-gray-400 border-none p-0 mt-2 focus:ring-0 bg-transparent resize-none placeholder:text-gray-700 block"
            style={{ minHeight: '1.5rem', height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
        </div>

        {/* Scrollable Content (Subtasks & Links & Custom Fields) */}
        <div className="flex-1 overflow-y-auto px-6 py-2 pb-4 space-y-4 custom-scrollbar min-h-[0] mb-14">

          {/* Custom Columns / Fields Grid */}
          {visibleColumns && visibleColumns.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {visibleColumns.map(colId => {
                if (['title', 'status', 'priority', 'date', 'listId', 'notes'].includes(colId)) return null; // handled elsewhere

                const def = getColumnDef(colId);
                if (!def) return null;

                const val = (editedTask.customValues && editedTask.customValues[colId]) || (editedTask as any)[colId];

                return (
                  <div key={colId} className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                      {def.icon} {def.label}
                    </label>
                    <input
                      type="text"
                      value={val || ''}
                      onChange={(e) => {
                        // Update custom value
                        const newCustom = { ...(editedTask.customValues || {}), [colId]: e.target.value };
                        setEditedTask({ ...editedTask, customValues: newCustom });
                      }}
                      className="bg-white/5 border border-white/5 rounded-lg px-2 py-1 text-xs text-aura-white focus:border-aura-accent/50 focus:ring-0"
                      placeholder="Sin valor"
                    />
                  </div>
                )
              })}
            </div>
          )}

          {/* Subtasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {/* Only show header if there are subtasks to save space, or keeps it minimal */}
              {editedTask.subtasks && editedTask.subtasks.length > 0 && <span className="text-[10px] font-bold text-gray-600 uppercase">Subtareas</span>}
            </div>
            <div className="space-y-1">
              {(editedTask.subtasks || []).map(sub => (
                <div key={sub.id} className="group flex items-center gap-3 p-1 hover:bg-white/5 rounded-lg transition-all">
                  <button onClick={() => toggleSubtask(sub.id)} className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${sub.isCompleted ? 'bg-aura-accent border-aura-accent text-aura-black' : 'border-gray-600'}`}>
                    {sub.isCompleted && <Check size={8} strokeWidth={3} />}
                  </button>
                  <input
                    value={sub.title}
                    onChange={(e) => {
                      const updated = (editedTask.subtasks || []).map(s => s.id === sub.id ? { ...s, title: e.target.value } : s);
                      updateField('subtasks', updated);
                    }}
                    className={`text-sm flex-1 bg-transparent border-none p-0 focus:ring-0 ${sub.isCompleted ? 'line-through text-gray-500' : 'text-gray-300'}`}
                  />
                  <button onClick={() => handleDeleteSubtask(sub.id)} className="text-gray-600 hover:text-red-400 opacity-100 p-1">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Compact Add Subtask */}
            <div className="flex items-center gap-2 text-gray-500 focus-within:text-white transition-colors">
              <Plus size={14} />
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Añadir subtarea"
                className="bg-transparent border-none p-0 text-sm focus:ring-0 placeholder:text-gray-600 flex-1"
              />
            </div>
          </div>

          {/* Link Manager (Compact) */}
          <div className="pt-2 border-t border-white/5">
            <LinkManager
              currentLinks={editedTask.links || []}
              onUpdateLinks={handleUpdateLinks}
              tasks={allTasks}
              notes={notes}
              contacts={contacts}
              files={files}
              excludeId={editedTask.id}
            />
          </div>
        </div>

        {/* Sticky Actions Bar (Todoist Style) */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#0f0f0f] border-t border-white/10 px-4 py-3 flex items-center justify-between z-20 gap-2">

          {/* Left: Metadata Chips (Scrollable row) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-right flex-1">

            {/* Date Chip */}
            <div className="relative shrink-0">
              <button
                ref={dateBtnRef}
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${editedTask.date ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
              >
                <Calendar size={14} />
                {editedTask.date ? new Date(editedTask.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Hoy'}
              </button>
              {showDatePicker && (
                <FixedPopover triggerRef={dateBtnRef} onClose={() => setShowDatePicker(false)}>
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl">
                    <DatePicker currentDate={editedTask.date} onChange={(d) => { updateField('date', d); setShowDatePicker(false); }} onClose={() => setShowDatePicker(false)} />
                  </div>
                </FixedPopover>
              )}
            </div>

            {/* Priority Chip */}
            <div className="relative shrink-0 flex bg-white/5 rounded-lg border border-white/5 p-0.5">
              {(['baja', 'media', 'alta'] as Priority[]).map(p => (
                <button
                  key={p}
                  onClick={() => updateField('priority', p)}
                  className={`p-1.5 rounded-md transition-all ${editedTask.priority === p ?
                    (p === 'alta' ? 'bg-red-500 text-white' : p === 'media' ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-black')
                    : 'text-gray-500 hover:text-gray-300'}`}
                  title={p}
                >
                  <Flag size={14} fill={editedTask.priority === p ? "currentColor" : "none"} />
                </button>
              ))}
            </div>

            {/* PROJECT CHIP */}
            <div className="relative shrink-0">
              <button
                ref={projectBtnRef}
                onClick={() => setShowProjectPicker(!showProjectPicker)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors max-w-[120px] ${editedTask.listId ? 'bg-white/5 border-white/10 text-gray-300' : 'border-transparent text-gray-500'}`}
              >
                <span className="truncate">{lists.find(l => l.id === editedTask.listId)?.name || 'Sin proyecto'}</span>
                <ChevronDown size={12} className="opacity-50" />
              </button>
              {showProjectPicker && (
                <FixedPopover triggerRef={projectBtnRef} onClose={() => setShowProjectPicker(false)}>
                  <div className="w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl p-2 max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
                    <div className="text-[10px] font-bold text-gray-500 uppercase px-2 py-1 mb-1">Proyecto</div>
                    {lists.map(l => (
                      <button
                        key={l.id}
                        onClick={() => { updateField('listId', l.id); setShowProjectPicker(false); }}
                        className="w-full text-left px-2 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 text-xs text-gray-300"
                      >
                        <span className={l.color}>{l.icon}</span>
                        <span className="truncate">{l.name}</span>
                        {editedTask.listId === l.id && <Check size={12} className="ml-auto text-aura-accent" />}
                      </button>
                    ))}
                  </div>
                </FixedPopover>
              )}
            </div>
          </div>

          {/* Right: Action Button */}
          <div className="flex items-center gap-2 shrink-0">
            {!isNew && (
              <button onClick={() => onDelete(task.id)} className="p-2 text-gray-500 hover:text-red-400 rounded-lg transition-colors">
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!editedTask.title.trim()}
              className={`w-9 h-9 flex items-center justify-center rounded-xl font-bold transition-all shadow-lg ${editedTask.title.trim() ? 'bg-aura-accent text-aura-black cursor-pointer transform active:scale-95' : 'bg-white/5 text-gray-600 cursor-not-allowed'}`}
            >
              {isNew ? <ArrowRight size={18} /> : <Check size={18} />}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TaskDetail;