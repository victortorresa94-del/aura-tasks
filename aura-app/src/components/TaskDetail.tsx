import React, { useState } from 'react';
import {
  X, Calendar, Flag, Tag, Trash2, Clock, MapPin, Phone,
  Music, AlignLeft, CheckSquare, ChevronDown, StickyNote, ArrowRight, Plus, Check, Loader, Trophy, ListTodo
} from 'lucide-react';
import { Task, Project, Priority, Note, Contact, FileItem, LinkedItem, TaskStatus, SubTask } from '../types';
import DatePicker from './DatePicker';
import LinkManager from './LinkManager';
import { parseDateFromText } from '../utils/auraLogic';

interface TaskDetailProps {
  task: Task;
  lists: Project[];
  statuses?: TaskStatus[];
  notes: Note[];
  contacts: Contact[];
  files: FileItem[];
  allTasks: Task[];
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
  onCreateNote?: (taskId: string, title: string) => void;
  onNavigateToNote?: (noteId: string) => void;
  onAddTab: (label: string, type: 'view' | 'project' | 'entity' | 'note' | 'task' | 'contact', data: any, path: string) => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({
  task, lists, statuses, notes, contacts, files, allTasks, onClose, onUpdate, onDelete, onCreateNote, onNavigateToNote, onAddTab
}) => {
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

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

    // Only parse if title changed significantly or is new (simple logic)
    // Actually, let's just parse if it's new or user wants... but here we just save.
    // If we want NLP on update, we'd do it. Let's stick to title = title for now to avoid accidental date changes.
    // Unless it's new.

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

  // Auto-save on unmount or close? No, better explicit save for editing. 
  // User asked for "Crear tareas sin pensar".

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:pb-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full h-[85vh] sm:h-auto sm:max-h-[85vh] sm:max-w-2xl bg-[#0f0f0f] border-t border-x border-white/10 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up ring-1 ring-white/5">
        {/* Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing" onClick={onClose}>
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar pb-24">

          {/* Main Inputs */}
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <input
                autoFocus={isNew}
                type="text"
                value={editedTask.title}
                onChange={(e) => updateField('title', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="w-full text-2xl font-bold text-aura-white border-none p-0 focus:ring-0 placeholder:text-gray-600 bg-transparent leading-relaxed"
                placeholder="¿Qué hay que hacer?"
              />
              <textarea
                value={editedTask.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Añadir detalles..."
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
          </div>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-2 mt-2">

            {/* 1. Priority (Colored) */}
            <div className="flex rounded-lg bg-white/5 p-1 gap-1 border border-white/5">
              {(['baja', 'media', 'alta'] as Priority[]).map(p => {
                const isSelected = editedTask.priority === p;
                let colorClass = 'text-gray-400 hover:text-white hover:bg-white/5';
                if (isSelected) {
                  if (p === 'alta') colorClass = 'bg-red-500/20 text-red-400 border border-red-500/20 shadow-sm';
                  if (p === 'media') colorClass = 'bg-amber-500/20 text-amber-400 border border-amber-500/20 shadow-sm';
                  if (p === 'baja') colorClass = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-sm';
                }

                return (
                  <button
                    key={p}
                    onClick={() => updateField('priority', p)}
                    className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition-all ${colorClass}`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* 2. Status (Moved here) */}
            <div className="relative">
              <button
                onClick={() => setShowStatusPicker(!showStatusPicker)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${currentStatus?.isCompleted ? 'bg-aura-accent/10 border-aura-accent/30 text-aura-accent' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}
              >
                <div className={`w-2 h-2 rounded-full ${currentStatus?.color || 'bg-gray-400'}`} />
                {currentStatus?.name || 'Estado'}
                <ChevronDown size={12} className="opacity-50" />
              </button>

              {showStatusPicker && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 p-1 animate-fade-in-up">
                  {statuses?.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { updateField('status', s.id); setShowStatusPicker(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 text-xs text-gray-300 transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full ${s.color}`} />
                      {s.name}
                      {editedTask.status === s.id && <Check size={12} className="ml-auto text-aura-accent" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Date */}
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${editedTask.date ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
              >
                <Calendar size={14} />
                {new Date(editedTask.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </button>
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 z-50">
                  <DatePicker currentDate={editedTask.date} onChange={(d) => { updateField('date', d); setShowDatePicker(false); }} onClose={() => setShowDatePicker(false)} />
                </div>
              )}
            </div>

            <div className="flex-1" />

            {/* 4. Project (Custom Dropdown) */}
            <div className="relative">
              <button
                onClick={() => setShowProjectPicker(!showProjectPicker)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${editedTask.listId ? 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:border-aura-accent/30' : 'bg-transparent border-transparent text-gray-500'}`}
              >
                <span className="text-gray-500">#</span>
                {lists.find(l => l.id === editedTask.listId)?.name || 'Sin proyecto'}
                <ChevronDown size={12} className="text-gray-500" />
              </button>

              {showProjectPicker && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 p-2 animate-fade-in-up max-h-60 overflow-y-auto custom-scrollbar">
                  <div className="text-[10px] font-bold text-gray-500 uppercase px-2 py-1 mb-1">Seleccionar Proyecto</div>
                  {lists.map(l => (
                    <button
                      key={l.id}
                      onClick={() => { updateField('listId', l.id); setShowProjectPicker(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 text-xs text-gray-300 transition-colors"
                    >
                      <span className={l.color}>{l.icon}</span>
                      <span className="truncate">{l.name}</span>
                      {editedTask.listId === l.id && <Check size={12} className="ml-auto text-aura-accent" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-white/5 w-full my-4" />

          {/* Subtasks Section */}
          {/* Subtasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 tracking-wider"><ListTodo size={12} /> Subtareas</h4>
              <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">
                {editedTask.subtasks?.filter(s => s.isCompleted).length || 0} / {editedTask.subtasks?.length || 0}
              </span>
            </div>

            <div className="space-y-1">
              {(editedTask.subtasks || []).map(sub => (
                <div key={sub.id} className="group flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/5">
                  <button onClick={() => toggleSubtask(sub.id)} className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shadow-sm ${sub.isCompleted ? 'bg-aura-accent border-aura-accent text-aura-black' : 'border-gray-600 hover:border-gray-400'}`}>
                    {sub.isCompleted && <Check size={10} strokeWidth={3} />}
                  </button>
                  <input
                    value={sub.title}
                    onChange={(e) => {
                      const updated = (editedTask.subtasks || []).map(s => s.id === sub.id ? { ...s, title: e.target.value } : s);
                      updateField('subtasks', updated);
                    }}
                    className={`text-sm flex-1 bg-transparent border-none p-0 focus:ring-0 ${sub.isCompleted ? 'line-through text-gray-500' : 'text-gray-300'}`}
                  />
                  <button onClick={() => handleDeleteSubtask(sub.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subtask Input */}
            <div className="relative group">
              {!newSubtaskTitle && (editedTask.subtasks?.length || 0) === 0 ? (
                <button
                  onClick={() => { setNewSubtaskTitle(' '); setTimeout(() => setNewSubtaskTitle(''), 50); }}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-aura-white px-2 py-2 rounded-xl border border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 w-full transition-all group"
                >
                  <Plus size={16} className="group-hover:text-aura-accent transition-colors" />
                  Añadir subtarea
                </button>
              ) : (
                <div className="flex items-center gap-3 px-2 py-1 bg-white/5 rounded-xl border border-white/5 focus-within:border-aura-accent/30 focus-within:bg-white/10 transition-all">
                  <Plus size={16} className="text-gray-500" />
                  <input
                    autoFocus
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSubtask();
                        // Keep focus? React handles existing refocus usually
                      }
                    }}
                    placeholder="Escribe una subtarea..."
                    className="flex-1 bg-transparent border-none text-sm focus:ring-0 text-white placeholder:text-gray-500 p-0 h-8"
                  />
                  {newSubtaskTitle && (
                    <button onClick={handleAddSubtask} className="text-xs font-bold text-aura-black bg-aura-accent px-2 py-1 rounded hover:bg-white transition-colors">Intro</button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* LINK MANAGER INTEGRATION */}
          <div className="bg-aura-gray/20 p-4 rounded-xl border border-dashed border-white/10">
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

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#0f0f0f] flex justify-between items-center sticky bottom-0 z-20">
          <div className="flex items-center gap-1">
            {!isNew && (
              <button onClick={() => onDelete(task.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors" title="Eliminar">
                <Trash2 size={18} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={!editedTask.title.trim()}
              className="px-5 py-2 bg-aura-white text-aura-black rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isNew ? <Plus size={16} /> : <Check size={16} />}
              {isNew ? 'Añadir tarea' : 'Guardar'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TaskDetail;