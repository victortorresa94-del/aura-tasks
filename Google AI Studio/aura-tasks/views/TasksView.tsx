import React, { useMemo, useState } from 'react';
import { 
  Plus, PlayCircle, Search, Layers, Flag, Filter, LayoutGrid, 
  List, AlignJustify, Kanban as KanbanIcon, ChevronDown, CheckCircle, Circle,
  ArrowUpDown, SlidersHorizontal, GripHorizontal
} from 'lucide-react';
import TaskItem from '../components/TaskItem';
import { Task, Project, CustomView, ViewLayout, GroupBy, SortBy, Priority, TaskStatus } from '../types';
import { getDailyQuote } from '../utils/auraLogic';

interface TasksViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  projects: Project[];
  statuses: TaskStatus[];
  currentView: string; // 'hoy', 'todas', or a custom view ID
  customViewData?: CustomView; 
  onUpdateView?: (updatedView: CustomView) => void;
  userName: string;
  onSelectTask: (task: Task) => void;
  onOpenSummary: () => void;
}

const TasksView: React.FC<TasksViewProps> = ({ 
  tasks, setTasks, projects, statuses, currentView, customViewData, onUpdateView, userName, onSelectTask, onOpenSummary 
}) => {
  const [search, setSearch] = useState('');
  // Drag and Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

  const quote = useMemo(() => getDailyQuote(), []);

  // -- CONFIGURATION RESOLUTION --
  const effectiveLayout: ViewLayout = customViewData?.layout || 'list';
  const effectiveGroupBy: GroupBy = customViewData?.groupBy || 'none';
  const effectiveSortBy: SortBy = customViewData?.sortBy || 'date';
  
  // Explicitly type filters to avoid 'unknown' type errors
  const effectiveFilters: CustomView['filters'] = customViewData?.filters || {};

  // -- DATA PROCESSING --

  // 1. Filter
  const filteredTasks = useMemo(() => {
    let base = tasks.filter(t => !t.isRecurring);
    
    // In standard views, hide completed by default unless in 'todas'
    if (!customViewData && currentView !== 'todas') {
        const doneStatusId = statuses.find(s => s.isCompleted)?.id;
        if (doneStatusId) base = base.filter(t => t.status !== doneStatusId);
    }

    // Standard Views Hardcoding
    if (currentView === 'hoy') {
      base = base.filter(t => t.date === new Date().toISOString().split('T')[0]);
    }

    // Custom Filters
    if (effectiveFilters.projectIds && effectiveFilters.projectIds.length > 0) {
      base = base.filter(t => effectiveFilters.projectIds!.includes(t.listId));
    }
    if (effectiveFilters.priority && effectiveFilters.priority.length > 0) {
      base = base.filter(t => effectiveFilters.priority!.includes(t.priority));
    }
    if (effectiveFilters.status && effectiveFilters.status.length > 0) {
      base = base.filter(t => effectiveFilters.status!.includes(t.status));
    }

    // Text Search
    if (search) {
      base = base.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    }
    
    return base;
  }, [tasks, currentView, effectiveFilters, search, statuses]);

  // 2. Sort
  const sortedTasks = useMemo(() => {
      const sorted = [...filteredTasks];
      sorted.sort((a, b) => {
          if (effectiveSortBy === 'date') return new Date(a.date).getTime() - new Date(b.date).getTime();
          if (effectiveSortBy === 'title') return a.title.localeCompare(b.title);
          if (effectiveSortBy === 'priority') {
              const pMap = { alta: 0, media: 1, baja: 2 };
              return pMap[a.priority] - pMap[b.priority];
          }
          return 0;
      });
      return sorted;
  }, [filteredTasks, effectiveSortBy]);

  // 3. Group (for Kanban or List Grouping)
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};

    // KANBAN or EXPLICIT GROUPING
    let groupingStrategy = effectiveGroupBy;
    
    // If Layout is Kanban but grouping is none, force grouping by Status
    if (effectiveLayout === 'kanban' && groupingStrategy === 'none') {
        groupingStrategy = 'status';
    }

    if (groupingStrategy === 'status') {
         statuses.forEach(s => groups[s.id] = []);
         sortedTasks.forEach(task => {
             if (groups[task.status]) groups[task.status].push(task);
             else {
                 if (!groups['fallback']) groups['fallback'] = [];
                 groups['fallback'].push(task);
             }
         });
    } else if (groupingStrategy === 'priority') {
         (['alta', 'media', 'baja'] as const).forEach(p => groups[p] = []);
         sortedTasks.forEach(task => {
             if (groups[task.priority]) groups[task.priority].push(task);
         });
    } else if (groupingStrategy === 'project') {
         projects.forEach(p => groups[p.id] = []);
         sortedTasks.forEach(task => {
             if (groups[task.listId]) groups[task.listId].push(task);
         });
    } else {
        // No grouping
        return { 'Todas': sortedTasks };
    }
    
    return groups;
  }, [sortedTasks, effectiveGroupBy, effectiveLayout, projects, statuses]);

  // -- HANDLERS (AUTO-SAVE) --

  const handleUpdateConfig = (key: keyof CustomView, value: any) => {
    if (!customViewData || !onUpdateView) return;
    onUpdateView({ ...customViewData, [key]: value });
  };

  const toggleFilter = (type: 'priority' | 'projectIds' | 'status', value: string) => {
    if (!customViewData || !onUpdateView) return;
    const current = (customViewData.filters as any)[type] || [];
    const exists = current.includes(value);
    const newVal = exists 
       ? current.filter((v: any) => v !== value)
       : [...current, value];
    
    onUpdateView({
       ...customViewData,
       filters: { ...customViewData.filters, [type]: newVal }
    });
  };

  const getStatusById = (id: string) => statuses.find(s => s.id === id);

  // -- DRAG AND DROP HANDLERS --

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
      setDraggedTaskId(taskId);
      // Minimal drag image
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, groupKey: string) => {
      e.preventDefault();
      setDragOverGroup(groupKey);
  };

  const handleDrop = (e: React.DragEvent, groupKey: string) => {
      e.preventDefault();
      setDragOverGroup(null);
      if (!draggedTaskId) return;

      const groupingStrategy = effectiveLayout === 'kanban' && effectiveGroupBy === 'none' ? 'status' : effectiveGroupBy;

      setTasks(prev => prev.map(t => {
          if (t.id !== draggedTaskId) return t;

          // Mutate the task based on where it was dropped
          if (groupingStrategy === 'status') {
              // Ensure groupKey is a valid status ID
              return { ...t, status: groupKey };
          }
          if (groupingStrategy === 'priority') {
              return { ...t, priority: groupKey as Priority };
          }
          if (groupingStrategy === 'project') {
              return { ...t, listId: groupKey };
          }
          return t;
      }));
      setDraggedTaskId(null);
  };

  // -- UI COMPONENTS --

  const ViewToolbar = () => {
    if (!customViewData) return null;
    
    // Ensure arrays are defined for rendering
    const statusFilters = effectiveFilters.status || [];
    const priorityFilters = effectiveFilters.priority || [];
    const projectFilters = effectiveFilters.projectIds || [];

    return (
      <div className="flex flex-col xl:flex-row xl:items-center gap-4 mb-6 bg-white p-3 rounded-xl border border-gray-100 shadow-sm animate-fade-in-up">
         {/* Layout Switcher */}
         <div className="flex bg-gray-100 rounded-lg p-1 shrink-0">
            {[
               { id: 'list', icon: <List size={16} />, label: 'Lista' },
               { id: 'compact', icon: <AlignJustify size={16} />, label: 'Compacta' },
               { id: 'kanban', icon: <KanbanIcon size={16} />, label: 'Tablero' },
               { id: 'grid', icon: <LayoutGrid size={16} />, label: 'Cuadrícula' },
            ].map((opt) => (
               <button
                 key={opt.id}
                 onClick={() => handleUpdateConfig('layout', opt.id)}
                 className={`p-2 rounded-md transition-all flex items-center gap-2 ${effectiveLayout === opt.id ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                 title={opt.label}
               >
                 {opt.icon}
                 <span className="text-xs font-medium hidden lg:inline">{opt.label}</span>
               </button>
            ))}
         </div>

         <div className="h-6 w-px bg-gray-200 hidden xl:block"></div>

         {/* ACTIONS: GROUP, SORT, FILTER */}
         <div className="flex flex-wrap items-center gap-2">
            
            {/* 1. GROUP BY */}
            <div className="relative group shrink-0">
               <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                  <Layers size={14} className="text-gray-400" /> 
                  <span className="hidden sm:inline">Agrupar:</span> 
                  <span className="text-indigo-600 font-bold capitalize">{effectiveGroupBy === 'none' ? 'Nada' : effectiveGroupBy === 'project' ? 'Proyecto' : effectiveGroupBy === 'priority' ? 'Prioridad' : 'Estado'}</span>
                  <ChevronDown size={12} className="text-gray-400" />
               </button>
               <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 shadow-xl rounded-lg p-1 w-32 z-20 hidden group-hover:block animate-fade-in-up">
                  {['none', 'status', 'priority', 'project'].map(g => (
                     <button key={g} onClick={() => handleUpdateConfig('groupBy', g)} className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 rounded text-gray-700 capitalize">
                        {g === 'none' ? 'Nada' : g === 'project' ? 'Proyecto' : g === 'priority' ? 'Prioridad' : 'Estado'}
                     </button>
                  ))}
               </div>
            </div>

            {/* 2. SORT BY */}
            <div className="relative group shrink-0">
               <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                  <ArrowUpDown size={14} className="text-gray-400" /> 
                  <span className="hidden sm:inline">Ordenar:</span>
                  <span className="text-indigo-600 font-bold capitalize">{effectiveSortBy === 'date' ? 'Fecha' : effectiveSortBy === 'title' ? 'Nombre' : 'Prioridad'}</span>
                  <ChevronDown size={12} className="text-gray-400" />
               </button>
               <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 shadow-xl rounded-lg p-1 w-32 z-20 hidden group-hover:block animate-fade-in-up">
                  {[
                      {id: 'date', label: 'Fecha'},
                      {id: 'priority', label: 'Prioridad'},
                      {id: 'title', label: 'Nombre'}
                  ].map(s => (
                     <button key={s.id} onClick={() => handleUpdateConfig('sortBy', s.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 rounded text-gray-700">
                        {s.label}
                     </button>
                  ))}
               </div>
            </div>

            <div className="h-4 w-px bg-gray-200 mx-1"></div>

            {/* 3. FILTERS */}
            <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-gray-400 uppercase mr-1 hidden sm:inline"><Filter size={10} className="inline mr-1"/>Filtros:</span>
                 
                 {/* Filter: Status */}
                 <div className="relative group shrink-0">
                    <button className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium hover:bg-gray-50 ${statusFilters.length ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-700'}`}>
                        Estados
                        {statusFilters.length ? <span className="bg-indigo-600 text-white px-1 rounded-full text-[9px]">{statusFilters.length}</span> : null}
                    </button>
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 shadow-xl rounded-lg p-2 w-40 z-20 hidden group-hover:block animate-fade-in-up">
                        {(statuses || []).map(s => (
                            <label key={s.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={statusFilters.includes(s.id)} 
                                    onChange={() => toggleFilter('status', s.id)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                />
                                <div className={`w-2 h-2 rounded-full ${s.color}`}></div>
                                <span className="text-xs truncate">{s.name}</span>
                            </label>
                        ))}
                    </div>
                 </div>

                 {/* Filter: Priority */}
                 <div className="relative group shrink-0">
                    <button className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium hover:bg-gray-50 ${priorityFilters.length ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-700'}`}>
                        Prioridad
                        {priorityFilters.length ? <span className="bg-indigo-600 text-white px-1 rounded-full text-[9px]">{priorityFilters.length}</span> : null}
                    </button>
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 shadow-xl rounded-lg p-2 w-40 z-20 hidden group-hover:block animate-fade-in-up">
                        {['alta', 'media', 'baja'].map(p => (
                            <label key={p} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={priorityFilters.includes(p as Priority)} 
                                    onChange={() => toggleFilter('priority', p)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                />
                                <span className="text-xs capitalize">{p}</span>
                            </label>
                        ))}
                    </div>
                 </div>

                 {/* Filter: Projects */}
                 <div className="relative group shrink-0">
                    <button className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium hover:bg-gray-50 ${projectFilters.length ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-700'}`}>
                        Proyectos
                        {projectFilters.length ? <span className="bg-indigo-600 text-white px-1 rounded-full text-[9px]">{projectFilters.length}</span> : null}
                    </button>
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 shadow-xl rounded-lg p-2 w-48 z-20 hidden group-hover:block animate-fade-in-up max-h-48 overflow-y-auto">
                        {(projects || []).map(p => (
                            <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={projectFilters.includes(p.id)} 
                                    onChange={() => toggleFilter('projectIds', p.id)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                                />
                                <span className="text-xs truncate">{p.icon} {p.name}</span>
                            </label>
                        ))}
                    </div>
                 </div>
            </div>
         </div>
      </div>
    );
  };

  // -- RENDERERS --

  const renderTask = (task: Task) => (
    <div 
      key={task.id}
      draggable={effectiveLayout === 'kanban'}
      onDragStart={(e) => handleDragStart(e, task.id)}
      className={effectiveLayout === 'kanban' ? 'cursor-grab active:cursor-grabbing transform transition-transform' : ''}
    >
        <TaskItem 
          task={task} 
          list={projects.find(l => l.id === task.listId)}
          statuses={statuses}
          onClick={onSelectTask}
          onToggle={(id) => {
              const doneId = statuses.find(s => s.isCompleted)?.id;
              const todoId = statuses.find(s => !s.isCompleted)?.id;
              if (doneId) {
                  const newStatus = task.status === doneId ? (todoId || task.status) : doneId;
                  setTasks(prev => prev.map(t => t.id === id ? {...t, status: newStatus} : t));
              }
          }}
          density={effectiveLayout === 'compact' ? 'compact' : 'comfortable'}
        />
    </div>
  );

  const renderGridCard = (task: Task) => {
     const project = projects.find(p => p.id === task.listId);
     const statusObj = getStatusById(task.status);
     
     const getIcon = () => {
        if(task.type === 'call') return '📞';
        if(task.type === 'shopping') return '🛒';
        if(task.type === 'event') return '📅';
        if(task.type === 'email') return '✉️';
        if(task.type === 'payment') return '💰';
        return '📝';
     };

     return (
        <div 
          key={task.id}
          onClick={() => onSelectTask(task)}
          className="bg-white border border-gray-100 hover:border-indigo-300 hover:shadow-md rounded-xl p-3 flex flex-col gap-2 cursor-pointer transition-all active:scale-95 h-28 justify-between relative group"
        >
           <div className="flex justify-between items-start">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
                 {getIcon()}
              </div>
              <div className={`w-2 h-2 rounded-full ${statusObj?.color || 'bg-gray-300'}`}></div>
           </div>
           
           <div>
              <h4 className="font-bold text-gray-800 text-xs line-clamp-2 leading-tight">{task.title}</h4>
              <p className="text-[10px] text-gray-400 mt-1 truncate">
                 {project ? project.name : 'Sin proyecto'}
              </p>
           </div>
           
           <div className={`absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full ${task.priority === 'alta' ? 'bg-red-500' : task.priority === 'media' ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
        </div>
     );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar pb-32">
        {currentView === 'hoy' && (
          <div className="bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group mb-6 shrink-0">
            <div className="relative z-10">
              <h2 className="text-xl font-bold mb-1">Hola, {userName} ✨</h2>
              <p className="text-indigo-200/80 italic text-sm">"{quote.text}"</p>
              <button onClick={onOpenSummary} className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all backdrop-blur-md">
                <PlayCircle size={18} /> Resumen de hoy
              </button>
            </div>
          </div>
        )}

        {/* CUSTOM VIEW TOOLBAR */}
        <ViewToolbar />

        {/* Search if not custom view or always? */}
        {!customViewData && (
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm shrink-0">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" value={search} onChange={(e) => setSearch(e.target.value)} 
                placeholder="Buscar tarea..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
              />
            </div>
        )}

        {/* TASKS RENDERER */}
        <div className="space-y-8">
           {Object.entries(groupedTasks).map(([groupKey, tasksInGroup]) => {
              // Group Key is Status ID, Priority, or Project ID depending on grouping strategy
              let groupingStrategy = effectiveLayout === 'kanban' && effectiveGroupBy === 'none' ? 'status' : effectiveGroupBy;
              let groupLabel = groupKey;
              let groupColor = 'bg-gray-100';

              if (groupingStrategy === 'status') {
                  const s = getStatusById(groupKey);
                  groupLabel = s ? s.name : 'Otros';
              } else if (groupingStrategy === 'project') {
                  const p = projects.find(pr => pr.id === groupKey);
                  groupLabel = p ? p.name : 'Sin Proyecto';
              } else if (groupingStrategy === 'priority') {
                  groupLabel = groupKey; // already a string
              }

              // Hide empty groups in LIST view, show in KANBAN
              if (tasksInGroup.length === 0 && effectiveLayout !== 'kanban') return null;

              return (
                 <div 
                    key={groupKey} 
                    onDragOver={(e) => effectiveLayout === 'kanban' ? handleDragOver(e, groupKey) : undefined}
                    onDrop={(e) => effectiveLayout === 'kanban' ? handleDrop(e, groupKey) : undefined}
                    className={`
                        ${effectiveLayout === 'kanban' ? 'min-w-[280px] w-[300px] flex flex-col rounded-xl transition-colors duration-200' : 'w-full'}
                        ${effectiveLayout === 'kanban' && dragOverGroup === groupKey ? 'bg-indigo-50 ring-2 ring-indigo-200' : ''}
                    `}
                 >
                    {/* Group Header */}
                    {(effectiveGroupBy !== 'none' || effectiveLayout === 'kanban') && (
                       <div className="flex items-center justify-between mb-3 px-1">
                          <div className="flex items-center gap-2">
                              {effectiveLayout === 'kanban' && groupingStrategy === 'status' && <div className={`w-3 h-3 rounded-full ${getStatusById(groupKey)?.color || 'bg-gray-300'}`}></div>}
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider capitalize">{groupLabel}</span>
                          </div>
                          <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">{tasksInGroup.length}</span>
                       </div>
                    )}

                    {/* Layouts */}
                    {effectiveLayout === 'grid' ? (
                       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {tasksInGroup.map(renderGridCard)}
                       </div>
                    ) : (
                       <div className={`space-y-3 ${effectiveLayout === 'kanban' ? 'bg-gray-50/50 p-2 rounded-xl h-full min-h-[500px] overflow-y-auto custom-scrollbar' : ''}`}>
                          {tasksInGroup.map(renderTask)}
                          
                          {/* Dropzone visual hint if empty */}
                          {effectiveLayout === 'kanban' && tasksInGroup.length === 0 && (
                              <div className="h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-300 text-xs">
                                Arrastra aquí
                              </div>
                          )}

                          {effectiveLayout === 'kanban' && (
                             <button 
                                onClick={() => {
                                    // Add task to this specific group context logic needed here if fully implemented
                                    // For now just general add
                                    // onAddTask(...) 
                                }}
                                className="w-full py-2 text-xs text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg border border-dashed border-gray-200 mt-2 transition-colors flex items-center justify-center gap-1"
                             >
                                <Plus size={14} /> Añadir
                             </button>
                          )}
                       </div>
                    )}
                 </div>
              );
           })}
        </div>

        {/* Empty State */}
        {filteredTasks.length === 0 && effectiveLayout !== 'kanban' && (
          <div className="text-center py-20 opacity-50">
            <Layers size={48} className="mx-auto mb-4" />
            <p className="font-medium">No hay tareas</p>
            {customViewData && <p className="text-sm mt-2">Prueba a limpiar los filtros.</p>}
          </div>
        )}
      </div>
      
      {/* Horizontal Scroll wrapper for Kanban */}
      {effectiveLayout === 'kanban' && (
         <style>{`
            .custom-scrollbar > div.space-y-8 {
               display: flex;
               gap: 1.5rem;
               overflow-x: auto;
               padding-bottom: 2rem;
               align-items: flex-start;
               height: 100%;
            }
         `}</style>
      )}
    </div>
  );
};

export default TasksView;