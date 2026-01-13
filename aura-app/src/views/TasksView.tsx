
import React, { useMemo, useState, useEffect } from 'react';
import {
   Plus, PlayCircle, Search, Layers, Flag, Filter, LayoutGrid,
   List, AlignJustify, Kanban as KanbanIcon, ChevronDown, CheckCircle, Circle,
   ArrowUpDown, SlidersHorizontal, GripHorizontal, Columns, GripVertical
} from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import TaskItem from '../components/TaskItem';
import { Task, Project, CustomView, ViewLayout, GroupBy, SortBy, Priority, TaskStatus } from '../types';
import { getViewConfig, saveViewConfig, ViewConfig } from '../utils/viewConfig';
import TodayPlanningSession from '../components/TodayPlanningSession';
import { AVAILABLE_COLUMNS, DEFAULT_VISIBLE_COLUMNS, getColumnDef } from '../utils/columnDefs';
import { ColumnHeader } from '../components/ColumnHeader';

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
   onUpdateTask?: (task: Task) => void;
}

const TasksView: React.FC<TasksViewProps> = ({
   tasks, setTasks, projects, statuses, currentView, customViewData, onUpdateView, userName, onSelectTask, onOpenSummary, onUpdateTask
}) => {
   const [search, setSearch] = useState('');
   const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
   const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

   // Standard view configuration state
   const [standardViewConfig, setStandardViewConfig] = useState<ViewConfig | null>(null);
   const isStandardView = !customViewData && (currentView === 'hoy' || currentView === 'todas' || currentView.startsWith('project_'));
   const [showPlanningSession, setShowPlanningSession] = useState(false);

   // Column Overrides State (Local for now, could be persisted)
   const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

   // Mobile-friendly menu state
   const [openMenu, setOpenMenu] = useState<'group' | 'sort' | 'filter' | 'columns' | null>(null);

   const toggleMenu = (menu: 'group' | 'sort' | 'filter' | 'columns') => {
      setOpenMenu(prev => prev === menu ? null : menu);
   };

   // Load saved configuration for standard views
   useEffect(() => {
      if (isStandardView) {
         const config = getViewConfig(currentView);
         setStandardViewConfig(config);
      } else {
         setStandardViewConfig(null);
      }
   }, [currentView, isStandardView]);

   // -- CONFIGURATION RESOLUTION --
   const effectiveLayout: ViewLayout = customViewData?.layout || standardViewConfig?.layout || 'list';
   const effectiveGroupBy: GroupBy | 'timeframe' = (customViewData?.groupBy || standardViewConfig?.groupBy || 'none') as GroupBy | 'timeframe';
   const effectiveSortBy: SortBy = customViewData?.sortBy || standardViewConfig?.sortBy || 'date';
   const effectiveFilters: CustomView['filters'] = customViewData?.filters || standardViewConfig?.filters || {};

   const rawVisibleColumns = customViewData?.visibleColumns || standardViewConfig?.visibleColumns || DEFAULT_VISIBLE_COLUMNS;
   const effectiveVisibleColumns = useMemo(() => {
      const cols = rawVisibleColumns.filter(c => c !== 'title');
      return ['title', ...cols];
   }, [rawVisibleColumns]);

   const handleToggleColumn = (colId: string) => {
      if (colId === 'title') return;
      const current = effectiveVisibleColumns;
      const exists = current.includes(colId);
      let newVal = exists ? current.filter(c => c !== colId) : [...current, colId];

      if (customViewData && onUpdateView) {
         onUpdateView({ ...customViewData, visibleColumns: newVal });
      } else if (isStandardView && standardViewConfig) {
         const updated = { ...standardViewConfig, visibleColumns: newVal };
         saveViewConfig(currentView, updated);
         setStandardViewConfig(updated);
      }
   };

   const handleUpdateConfig = (key: keyof CustomView, value: any) => {
      if (customViewData && onUpdateView) {
         onUpdateView({ ...customViewData, [key]: value });
      } else if (isStandardView && standardViewConfig) {
         const updated = { ...standardViewConfig, [key]: value };
         saveViewConfig(currentView, updated);
         setStandardViewConfig(updated);
      }
   };

   const toggleFilter = (type: 'priority' | 'projectIds' | 'status', value: string) => {
      let current: any[] = [];
      if (customViewData) current = (customViewData.filters as any)[type] || [];
      else if (standardViewConfig) current = (standardViewConfig.filters as any)[type] || [];
      const exists = current.includes(value);
      const newVal = exists ? current.filter((v: any) => v !== value) : [...current, value];
      if (customViewData && onUpdateView) {
         onUpdateView({ ...customViewData, filters: { ...customViewData.filters, [type]: newVal } });
      } else if (isStandardView && standardViewConfig) {
         const currentFilters = standardViewConfig.filters || {};
         const updated = { ...standardViewConfig, filters: { ...currentFilters, [type]: newVal } };
         saveViewConfig(currentView, updated);
         setStandardViewConfig(updated);
      }
   };

   // Resizing handler
   const handleResizeColumn = (colId: string, width: number) => {
      setColumnWidths(prev => ({ ...prev, [colId]: width }));
   };

   // -- DATA PROCESSING --

   const filteredTasks = useMemo(() => {
      let base = tasks.filter(t => !t.isRecurring);
      if (!customViewData && currentView !== 'todas' && currentView !== 'hoy') {
         const doneStatusId = statuses.find(s => s.isCompleted)?.id;
         if (doneStatusId) base = base.filter(t => t.status !== doneStatusId);
      }
      if (currentView === 'hoy') {
         const today = new Date().toISOString().split('T')[0];
         base = base.filter(t => t.date === today);
      }
      if (effectiveFilters.projectIds?.length) base = base.filter(t => effectiveFilters.projectIds!.includes(t.listId));
      if (effectiveFilters.priority?.length) base = base.filter(t => effectiveFilters.priority!.includes(t.priority));
      if (effectiveFilters.status?.length) base = base.filter(t => effectiveFilters.status!.includes(t.status));
      if (search) base = base.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
      return base;
   }, [tasks, currentView, effectiveFilters, search, statuses]);

   const sortedTasks = useMemo(() => {
      const sorted = [...filteredTasks];
      sorted.sort((a, b) => {
         if (effectiveSortBy === 'date') return new Date(a.date || '9999-12-31').getTime() - new Date(b.date || '9999-12-31').getTime();
         if (effectiveSortBy === 'title') return a.title.localeCompare(b.title);
         if (effectiveSortBy === 'priority') {
            const pMap = { alta: 0, media: 1, baja: 2 };
            return pMap[a.priority] - pMap[b.priority];
         }
         return 0;
      });
      return sorted;
   }, [filteredTasks, effectiveSortBy]);

   const getTimeframeGroup = (dateStr?: string) => {
      if (!dateStr) return 'Más adelante';
      const d = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'Atrasadas';
      if (diffDays === 0) return 'Hoy';
      if (diffDays === 1) return 'Mañana';
      if (diffDays <= 7) return 'Esta semana';
      if (diffDays <= 14) return 'Semana que viene';
      return 'Más adelante';
   };

   const groupedTasks: Record<string, Task[]> = useMemo(() => {
      const groups: Record<string, Task[]> = {};
      let groupingStrategy = effectiveGroupBy;

      if (effectiveLayout === 'kanban' && groupingStrategy === 'none') groupingStrategy = 'status';

      if (groupingStrategy === 'status') {
         statuses.forEach(s => groups[s.id] = []);
         sortedTasks.forEach(task => { groups[task.status] ? groups[task.status].push(task) : (groups['fallback'] = groups['fallback'] || []).push(task) });
      } else if (groupingStrategy === 'priority') {
         (['alta', 'media', 'baja'] as const).forEach(p => groups[p] = []);
         sortedTasks.forEach(task => { groups[task.priority] ? groups[task.priority].push(task) : null });
      } else if (groupingStrategy === 'project') {
         projects.forEach(p => groups[p.id] = []);
         sortedTasks.forEach(task => { groups[task.listId] ? groups[task.listId].push(task) : null });
      } else if (groupingStrategy === 'timeframe') {
         // Explicit order
         ['Atrasadas', 'Hoy', 'Mañana', 'Esta semana', 'Semana que viene', 'Más adelante'].forEach(k => groups[k] = []);
         sortedTasks.forEach(task => {
            const key = getTimeframeGroup(task.date);
            if (!groups[key]) groups[key] = [];
            groups[key].push(task);
         });
      } else {
         return { 'Todas': sortedTasks };
      }
      return groups;
   }, [sortedTasks, effectiveGroupBy, effectiveLayout, projects, statuses]);

   const getStatusById = (id: string) => statuses.find(s => s.id === id);

   // -- DRAG AND DROP --
   const handleDragStart = (e: React.DragEvent, taskId: string) => { setDraggedTaskId(taskId); e.dataTransfer.effectAllowed = 'move'; };
   const handleDragOver = (e: React.DragEvent, groupKey: string) => { e.preventDefault(); setDragOverGroup(groupKey); };
   const handleDrop = (e: React.DragEvent, groupKey: string) => {
      e.preventDefault(); setDragOverGroup(null);
      if (!draggedTaskId) return;
      const strategy = effectiveLayout === 'kanban' && effectiveGroupBy === 'none' ? 'status' : effectiveGroupBy;
      setTasks(prev => prev.map(t => {
         if (t.id !== draggedTaskId) return t;
         if (strategy === 'status') return { ...t, status: groupKey };
         if (strategy === 'priority') return { ...t, priority: groupKey as Priority };
         if (strategy === 'project') return { ...t, listId: groupKey };
         return t;
      }));
      setDraggedTaskId(null);
   };

   // -- UI --
   // Refactored ViewToolbar to be part of the main render to avoid re-mounting issues
   const activeFiltersCount = (effectiveFilters.status?.length || 0) + (effectiveFilters.priority?.length || 0) + (effectiveFilters.projectIds?.length || 0);

   const renderToolbar = () => (
      <div className="sticky top-0 z-40 bg-aura-black/95 backdrop-blur-md pb-2 mb-4 border-b border-white/5 -mx-4 px-4 md:mx-0 md:px-0">
         <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-right py-2">

            {/* 1. Layout & View Modes */}
            <div className="flex bg-aura-gray/50 rounded-lg p-0.5 shrink-0 border border-white/5 mr-2">
               {[{ id: 'list', icon: <List size={16} /> }, { id: 'kanban', icon: <KanbanIcon size={16} /> }].map((opt) => (
                  <button key={opt.id} onClick={() => handleUpdateConfig('layout', opt.id)} className={`p-1.5 rounded-md transition-all ${effectiveLayout === opt.id ? 'bg-aura-gray-light text-aura-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
                     {opt.icon}
                  </button>
               ))}
            </div>

            <div className="h-5 w-px bg-white/10 shrink-0"></div>

            {/* Search */}
            <div className="flex items-center bg-white/5 rounded-lg border border-white/5 px-2 py-1 focus-within:ring-1 focus-within:ring-aura-accent/50 shrink-0 w-32 sm:w-48">
               <Search size={14} className="text-gray-500 mr-2" />
               <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="bg-transparent border-none p-0 text-xs w-full focus:ring-0 text-gray-300" />
            </div>

            {/* Group By */}
            <div className="relative shrink-0">
               <button onClick={() => toggleMenu('group')} className={`px-2 py-1.5 rounded-lg border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors ${effectiveGroupBy !== 'none' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                  <Layers size={14} /> <span className="hidden sm:inline">Agrupar</span>
               </button>
               {openMenu === 'group' && (
                  <>
                     <div className="fixed inset-0 z-50" onClick={() => setOpenMenu(null)} />
                     <div className="absolute top-full left-0 mt-2 bg-aura-gray border border-white/10 shadow-xl rounded-xl p-1 w-48 z-[60] animate-fade-in-up">
                        {['none', 'status', 'priority', 'project', 'timeframe'].map(g => (
                           <button key={g} onClick={() => { handleUpdateConfig('groupBy', g); setOpenMenu(null); }} className={`w-full text-left px-3 py-2 text-xs rounded-lg mb-0.5 flex items-center justify-between ${effectiveGroupBy === g ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
                              <span className="capitalize">{g === 'none' ? 'Sin agrupar' : g === 'timeframe' ? 'Tiempo aprox.' : g}</span>
                              {effectiveGroupBy === g && <CheckCircle size={12} className="text-aura-accent" />}
                           </button>
                        ))}
                     </div>
                  </>
               )}
            </div>

            {/* Sort By */}
            <div className="relative shrink-0">
               <button onClick={() => toggleMenu('sort')} className={`px-2 py-1.5 rounded-lg border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors ${effectiveSortBy !== 'date' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                  <ArrowUpDown size={14} /> <span className="hidden sm:inline">Ordenar</span>
               </button>
               {openMenu === 'sort' && (
                  <>
                     <div className="fixed inset-0 z-50" onClick={() => setOpenMenu(null)} />
                     <div className="absolute top-full left-0 mt-2 bg-aura-gray border border-white/10 shadow-xl rounded-xl p-1 w-40 z-[60] animate-fade-in-up">
                        {['date', 'priority', 'title'].map(s => (
                           <button key={s} onClick={() => { handleUpdateConfig('sortBy', s); setOpenMenu(null); }} className={`w-full text-left px-3 py-2 text-xs rounded-lg mb-0.5 flex items-center justify-between ${effectiveSortBy === s ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
                              <span className="capitalize">{s}</span>
                              {effectiveSortBy === s && <CheckCircle size={12} className="text-aura-accent" />}
                           </button>
                        ))}
                     </div>
                  </>
               )}
            </div>

            {/* Filter */}
            <div className="relative shrink-0">
               <button onClick={() => toggleMenu('filter')} className={`px-2 py-1.5 rounded-lg border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors ${activeFiltersCount > 0 ? 'bg-aura-accent text-aura-black ring-1 ring-aura-accent' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                  <Filter size={14} /> {activeFiltersCount > 0 && <span className="text-[10px]">{activeFiltersCount}</span>}
               </button>
               {openMenu === 'filter' && (
                  <>
                     <div className="fixed inset-0 z-50" onClick={() => setOpenMenu(null)} />
                     <div className="absolute top-full left-0 mt-2 bg-aura-gray border border-white/10 shadow-xl rounded-xl p-3 w-64 z-[60] animate-fade-in-up">
                        <div className="space-y-3">
                           <div>
                              <h6 className="text-[10px] uppercase font-bold text-gray-500 mb-1">Prioridad</h6>
                              <div className="flex gap-1">{['alta', 'media', 'baja'].map(p => (
                                 <button key={p} onClick={() => toggleFilter('priority', p)} className={`flex-1 py-1 rounded text-[10px] uppercase font-bold border ${effectiveFilters.priority?.includes(p as any) ? 'bg-white text-black border-white' : 'border-white/10 text-gray-500 hover:border-white/30'}`}>{p}</button>
                              ))}</div>
                           </div>
                           <div>
                              <h6 className="text-[10px] uppercase font-bold text-gray-500 mb-1">Estado</h6>
                              <div className="space-y-0.5">{statuses.map(s => (
                                 <button key={s.id} onClick={() => toggleFilter('status', s.id)} className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs ${effectiveFilters.status?.includes(s.id) ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                                    <div className={`w-2 h-2 rounded-full ${s.color}`}></div> {s.name}
                                 </button>
                              ))}</div>
                           </div>
                        </div>
                     </div>
                  </>
               )}
            </div>

         </div>
      </div>
   );

   // -- RENDERERS --
   const renderTask = (task: Task) => (
      <div key={task.id} draggable={effectiveLayout === 'kanban'} onDragStart={(e) => handleDragStart(e, task.id)} className={effectiveLayout === 'kanban' ? 'cursor-grab active:cursor-grabbing transform transition-transform' : ''}>
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
                  if (onUpdateTask) onUpdateTask({ ...task, status: newStatus });
                  setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
               }
            }}
            onUpdateTask={onUpdateTask}
            visibleColumns={effectiveVisibleColumns}
            columnWidths={columnWidths} // Pass widths to TaskItem
         />
      </div>
   );

   const renderGridCard = (task: Task) => (
      <div key={task.id} onClick={() => onSelectTask(task)} className="bg-aura-gray/30 border border-white/5 hover:border-aura-accent/30 rounded-xl p-3 flex flex-col gap-2 cursor-pointer transition-all h-28 justify-between relative group overflow-hidden">
         <div className="flex justify-between items-start z-10">
            <div className="w-8 h-8 rounded-lg bg-white/5 text-aura-white flex items-center justify-center text-lg">📝</div>
            <div className={`w-2 h-2 rounded-full ${getStatusById(task.status)?.color || 'bg-gray-500'}`}></div>
         </div>
         <div className="z-10"><h4 className="font-bold text-aura-white text-xs line-clamp-2">{task.title}</h4></div>
      </div>
   );

   return (
      <div className="h-full flex flex-col overflow-hidden relative">
         <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 custom-scrollbar pb-32">

            {currentView === 'hoy' && (
               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-aura-white">Tareas de Hoy</h2>
                  <button onClick={() => setShowPlanningSession(true)} className="flex items-center gap-2 px-3 py-1.5 bg-aura-accent/10 border border-aura-accent/20 hover:bg-aura-accent/20 text-aura-accent rounded-lg text-xs font-bold transition-all animate-pulse-slow">
                     <PlayCircle size={14} /> Planificar día
                  </button>
               </div>
            )}

            {renderToolbar()}

            {/* HEADER ROW for List View */}
            {effectiveLayout === 'list' && groupedTasks && Object.values(groupedTasks).some(g => g.length > 0) && (
               <div className="hidden md:flex items-center gap-4 px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 mb-2 select-none pr-4">
                  {/* Title Col (Flexible) */}
                  <div className="flex-1">Tarea</div>

                  {/* Dynamic Cols using ColumnHeader */}
                  {effectiveVisibleColumns.map(colId => {
                     if (colId === 'title') return null; // handled above
                     const def = getColumnDef(colId);
                     if (!def) return null;

                     const currentWidth = columnWidths[colId] || def.minWidth;

                     return (
                        <ColumnHeader
                           key={colId}
                           colId={colId}
                           label={def.label}
                           icon={def.icon}
                           type={def.type}
                           width={currentWidth}
                           minWidth={def.minWidth}
                           fixed={def.fixed}
                           onResize={(w) => handleResizeColumn(colId, w)}
                           onHide={() => handleToggleColumn(colId)}
                        />
                     )
                  })}

                  {/* Add Column Button inside Header */}
                  <div className="w-8 flex justify-center relative">
                     <button onClick={() => toggleMenu('columns')} className="text-gray-600 hover:text-white transition-colors p-1">
                        <Plus size={14} />
                     </button>
                     {openMenu === 'columns' && (
                        <>
                           <div className="fixed inset-0 z-40 cursor-default" onClick={() => setOpenMenu(null)} />
                           <div className="absolute top-full right-0 mt-2 bg-aura-gray border border-white/10 shadow-xl rounded-xl p-2 w-56 z-50 animate-fade-in-up max-h-80 overflow-y-auto custom-scrollbar">
                              <div className="text-[10px] font-bold text-gray-500 uppercase px-2 mb-2">Columnas visibles</div>
                              {AVAILABLE_COLUMNS.map(col => {
                                 const isActive = effectiveVisibleColumns.includes(col.id);
                                 return (
                                    <button
                                       key={col.id}
                                       onClick={() => handleToggleColumn(col.id)}
                                       disabled={col.fixed}
                                       className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-xs mb-0.5 ${isActive ? 'bg-white/5 text-white' : 'text-gray-500 hover:bg-white/5'} ${col.fixed ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                       <span className="text-gray-400">{col.icon}</span>
                                       <span className="flex-1 text-left">{col.label}</span>
                                       {isActive && <CheckCircle size={12} className="text-aura-accent" />}
                                    </button>
                                 );
                              })}
                           </div>
                        </>
                     )}
                  </div>
               </div>
            )}

            {/* TASKS RENDERER */}
            <div className="space-y-8">
               {Object.entries(groupedTasks).map(([groupKey, tasksInGroup]) => {
                  // Clean up group label
                  let groupLabel = groupKey;
                  if (effectiveGroupBy === 'status') { groupLabel = getStatusById(groupKey)?.name || 'Otros'; }
                  if (effectiveGroupBy === 'priority') { groupLabel = groupKey; }

                  if (tasksInGroup.length === 0 && effectiveLayout !== 'kanban') return null;

                  return (
                     <div key={groupKey} onDragOver={(e) => handleDragOver(e, groupKey)} onDrop={(e) => handleDrop(e, groupKey)} className={`${effectiveLayout === 'kanban' ? 'min-w-[280px] w-[300px] flex flex-col rounded-xl' : 'w-full'} ${dragOverGroup === groupKey ? 'opacity-80' : ''}`}>
                        {/* Group Header */}
                        {(effectiveGroupBy !== 'none' || effectiveLayout === 'kanban') && (
                           <div className="flex items-center gap-3 mb-3 px-2">
                              <span className="text-sm font-bold text-gray-400 capitalize">{groupLabel}</span>
                              <span className="text-xs bg-white/10 text-gray-500 px-2 rounded-full">{tasksInGroup.length}</span>
                           </div>
                        )}

                        {effectiveLayout === 'grid' ? (
                           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">{tasksInGroup.map(renderGridCard)}</div>
                        ) : (
                           <div className={`space-y-1 ${effectiveLayout === 'kanban' ? 'bg-aura-gray/10 p-2 rounded-xl h-full min-h-[500px] overflow-y-auto custom-scrollbar border border-white/5' : ''}`}>
                              {tasksInGroup.map(renderTask)}
                              {effectiveLayout === 'kanban' && tasksInGroup.length === 0 && (
                                 <div className="h-20 border-2 border-dashed border-gray-800 rounded-lg flex items-center justify-center text-gray-600 text-xs text-center p-4">Arrastra aquí</div>
                              )}
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>

            {/* Empty State */}
            {filteredTasks.length === 0 && effectiveLayout !== 'kanban' && (
               <EmptyState icon={Layers} title="No hay tareas" description="Todo limpio por aquí." />
            )}
         </div>

         <TodayPlanningSession
            isOpen={showPlanningSession}
            onClose={() => setShowPlanningSession(false)}
            tasks={tasks} // Pass all, internal logic filters pending
            statuses={statuses}
            userName={userName}
            onUpdateTask={(t) => onUpdateTask && onUpdateTask(t)}
         />

         {effectiveLayout === 'kanban' && (
            <style>{`.custom-scrollbar > div.space-y-8 { display: flex; gap: 1.5rem; overflow-x: auto; padding-bottom: 2rem; align-items: flex-start; height: 100%; }`}</style>
         )}
      </div>
   );
};

export default TasksView;