import React, { useState } from 'react';
import { 
  X, Calendar, Flag, Tag, Trash2, Clock, MapPin, Phone, 
  Music, AlignLeft, CheckSquare, ChevronDown, StickyNote, ArrowRight, Plus, Check, Loader
} from 'lucide-react';
import { Task, Project, Priority, Note, Contact, FileItem, LinkedItem, TaskStatus } from '../types';
import DatePicker from './DatePicker';
import LinkManager from './LinkManager';
import { parseDateFromText } from '../utils/auraLogic';

interface TaskDetailProps {
  task: Task;
  lists: Project[];
  statuses?: TaskStatus[]; // New Prop
  notes: Note[]; 
  contacts: Contact[];
  files: FileItem[];
  allTasks: Task[]; // Needed for linking tasks to tasks
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
  onCreateNote?: (taskId: string, title: string) => void;
  onNavigateToNote?: (noteId: string) => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ 
  task, lists, statuses, notes, contacts, files, allTasks, onClose, onUpdate, onDelete, onCreateNote, onNavigateToNote 
}) => {
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  
  // Check if it's a new task (not in the list yet)
  const isNew = !allTasks.find(t => t.id === task.id);
  const currentStatus = statuses?.find(s => s.id === editedTask.status);

  const updateField = (field: keyof Task, value: any) => {
    const updated = { ...editedTask, [field]: value };
    setEditedTask(updated);
    // Removed auto-save: onUpdate(updated); 
  };

  const handleUpdateLinks = (newLinks: LinkedItem[]) => {
    updateField('links', newLinks);
  };

  const handleSave = () => {
    if (!editedTask.title.trim()) return;

    // Apply NLP to title before saving
    const { title: cleanTitle, date: nlpDate } = parseDateFromText(editedTask.title);
    
    const finalTask = {
      ...editedTask,
      title: cleanTitle,
      // Only override date with NLP if user hasn't manually changed it from default today 
      // OR if we assume NLP always wins on save. Let's let NLP win if a date is found.
      date: nlpDate || editedTask.date 
    };

    onUpdate(finalTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">
        {/* Drag Handle for Mobile */}
        <div className="sm:hidden w-full flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <select 
              value={editedTask.listId}
              onChange={(e) => updateField('listId', e.target.value)}
              className="text-sm font-medium bg-gray-50 border-none rounded-lg py-1 pl-2 pr-8 focus:ring-0 cursor-pointer"
            >
              {lists.map(l => (
                <option key={l.id} value={l.id}>{l.icon} {l.name}</option>
              ))}
            </select>
            
            {/* Status Picker */}
            {statuses && (
               <div className="relative">
                  <button 
                     onClick={() => setShowStatusPicker(!showStatusPicker)}
                     className={`text-xs font-bold uppercase tracking-wider px-2 py-1.5 rounded-lg flex items-center gap-1 text-white ${currentStatus?.color || 'bg-gray-400'}`}
                  >
                     {currentStatus?.name || 'Estado'}
                     <ChevronDown size={12}/>
                  </button>
                  {showStatusPicker && (
                     <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 shadow-xl rounded-lg p-1 w-32 z-50">
                        {statuses.map(s => (
                           <button 
                              key={s.id} 
                              onClick={() => { updateField('status', s.id); setShowStatusPicker(false); }}
                              className="w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded flex items-center gap-2"
                           >
                              <div className={`w-2 h-2 rounded-full ${s.color}`}></div>
                              <span className="text-xs font-medium text-gray-700">{s.name}</span>
                           </button>
                        ))}
                     </div>
                  )}
               </div>
            )}
          </div>

          <div className="flex items-center gap-2">
             {!isNew && (
                <button 
                  onClick={() => onDelete(task.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={20} />
                </button>
             )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar pb-20 sm:pb-6">
          {/* Title input */}
          <input
            autoFocus={isNew}
            type="text"
            value={editedTask.title}
            onChange={(e) => updateField('title', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full text-2xl font-bold text-gray-900 border-none p-0 focus:ring-0 placeholder:text-gray-300 bg-transparent"
            placeholder="¿Qué hay que hacer? (ej: Comprar pan el viernes)"
          />

          {/* Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Flag size={12} /> Prioridad
              </label>
              <div className="flex gap-2">
                {(['baja', 'media', 'alta'] as Priority[]).map(p => (
                  <button
                    key={p}
                    onClick={() => updateField('priority', p)}
                    className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-sm font-medium capitalize border transition-all ${
                      editedTask.priority === p 
                        ? 'bg-gray-900 text-white border-gray-900' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Date with Custom Picker */}
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} /> Fecha
              </label>
              <button 
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full text-left bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
              >
                <span>{new Date(editedTask.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              
              {showDatePicker && (
                <div className="absolute top-full left-0 z-10 w-full sm:w-auto">
                   <div className="fixed inset-0 z-0 sm:hidden" onClick={() => setShowDatePicker(false)}></div>
                   <DatePicker 
                     currentDate={editedTask.date}
                     onChange={(date) => updateField('date', date)}
                     onClose={() => setShowDatePicker(false)}
                   />
                </div>
              )}
            </div>
          </div>

          {/* LINK MANAGER INTEGRATION */}
          <div className="bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">
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

           {/* Simple Notes */}
           <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <AlignLeft size={12} /> Descripción / Detalles
            </label>
            <textarea 
              value={editedTask.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Añade detalles rápidos..."
              className="w-full h-24 text-sm bg-gray-50 border border-gray-200 rounded-xl p-4 focus:border-indigo-500 focus:ring-indigo-500 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/80 backdrop-blur-sm sticky bottom-0 z-20">
            <button 
              onClick={onClose} 
              className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-bold text-sm"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              disabled={!editedTask.title.trim()}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
            >
              <Check size={18} />
              {isNew ? 'Crear Tarea' : 'Guardar Cambios'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;