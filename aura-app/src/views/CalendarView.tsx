import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Plus, X, Clock, AlignLeft, MapPin, Link as LinkIcon, Users, CheckSquare, Flag } from 'lucide-react';
import { Task, Priority } from '../types';

interface CalendarViewProps {
    tasks: Task[];
    onAddTask?: (task: Task) => void;
    onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

type Mode = 'event' | 'task';

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onAddTask, onUpdateTask }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creationMode, setCreationMode] = useState<Mode>('event');

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [time, setTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [isAllDay, setIsAllDay] = useState(false);
    const [location, setLocation] = useState('');
    const [url, setUrl] = useState('');
    const [priority, setPriority] = useState<Priority>('media');

    // Swipe State
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        if (isLeftSwipe) {
            nextMonth();
        }
        if (isRightSwipe) {
            prevMonth();
        }
    };

    // Navigation
    const goToToday = () => setCurrentDate(new Date());
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const jumpToDate = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.valueAsDate) setCurrentDate(e.target.valueAsDate);
    };

    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1; // Start Monday
    };

    const openCreationModal = (date: Date, mode: Mode = 'event') => {
        setSelectedDay(date);
        setCreationMode(mode);
        // Reset form
        setTitle(''); setDescription(''); setTime('09:00'); setEndTime('10:00');
        setIsAllDay(false); setLocation(''); setUrl(''); setPriority('media');
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        if (!title.trim() || !selectedDay || !onAddTask) return;

        const dateStr = selectedDay.toISOString().split('T')[0];

        const newTask: Task = {
            id: Date.now().toString(),
            ownerId: '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            title,
            description: description,
            date: dateStr,
            status: 'pendiente',
            priority: priority,
            type: creationMode === 'event' ? 'event' : 'normal',
            notes: description, // Mapping description to notes
            listId: '1', // Default
            tags: creationMode === 'event' ? ['evento'] : [],

            // Event specific
            eventDate: dateStr,
            isAllDay: isAllDay,
            startTime: isAllDay ? undefined : time,
            endTime: isAllDay ? undefined : endTime,
            locationName: location,
            url: url,
        };

        onAddTask(newTask);
        setIsModalOpen(false);
    };

    // Calendar Grid Generation
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <div
            className="h-full flex flex-col bg-aura-black text-aura-white overflow-hidden animate-fade-in-up"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* HEADER */}
            <div className="p-4 flex items-center justify-between border-b border-white/5 bg-aura-black/90 shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold capitalize flex items-center gap-2">
                        <span className="text-aura-accent">{monthNames[currentDate.getMonth()]}</span>
                        <span className="text-gray-500 font-light">{currentDate.getFullYear()}</span>
                    </h2>
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/5">
                        <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"><ChevronLeft size={18} /></button>
                        <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors"><ChevronRight size={18} /></button>
                    </div>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-gray-300"
                    >
                        Hoy
                    </button>
                    <div className="relative group">
                        <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white opacity-50 hover:opacity-100">
                            <CalIcon size={18} />
                        </button>
                        <input
                            type="date"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={jumpToDate}
                        />
                    </div>
                </div>

                <button
                    onClick={() => openCreationModal(new Date(), 'event')}
                    className="bg-aura-accent text-aura-black px-4 py-2 rounded-xl font-bold hover:bg-aura-accent/90 flex items-center gap-2 shadow-lg shadow-aura-accent/10 transition-transform active:scale-95"
                >
                    <Plus size={18} /> <span className="hidden sm:inline">Nuevo Evento</span>
                </button>
            </div>

            {/* WEEK HEADER */}
            <div className="grid grid-cols-7 border-b border-white/5 bg-aura-gray/5 shrink-0">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                    <div key={d} className="p-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>

            {/* CALENDAR GRID */}
            <div className="flex-1 w-full overflow-y-auto bg-aura-black/20 relative">
                <div className="grid grid-cols-7 auto-rows-fr min-h-full">
                    {/* Empty Slots */}
                    {Array.from({ length: startDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-aura-black/30 border-r border-b border-white/5 min-h-[100px] lg:min-h-0" />
                    ))}

                    {/* Days */}
                    {Array.from({ length: totalDays }).map((_, i) => {
                        const dayNum = i + 1;
                        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
                        const dateStr = dayDate.toISOString().split('T')[0];
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;
                        const dayTasks = tasks.filter(t => t.date === dateStr);

                        return (
                            <div
                                key={dayNum}
                                className={`border-r border-b border-white/5 p-2 flex flex-col group transition-colors relative min-h-[100px] lg:min-h-0 ${isToday ? 'bg-aura-accent/5' : 'bg-aura-black hover:bg-white/5'}`}
                                onClick={() => openCreationModal(dayDate)}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium ${isToday ? 'bg-aura-accent text-aura-black shadow-lg shadow-aura-accent/20' : 'text-gray-400'}`}>
                                        {dayNum}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openCreationModal(dayDate, 'task'); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-all"
                                        title="Añadir Tarea rápida"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                <div className="flex-1 w-full space-y-1 overflow-y-auto custom-scrollbar">
                                    {dayTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className={`px-1.5 py-0.5 text-xs rounded border-l-2 truncate cursor-pointer transition-transform hover:scale-[1.02] ${task.type === 'event'
                                                ? 'bg-purple-500/10 text-purple-200 border-purple-500'
                                                : task.status === 'done'
                                                    ? 'bg-white/5 text-gray-500 border-gray-600 line-through'
                                                    : 'bg-aura-gray text-white border-aura-accent'
                                                }`}
                                            onClick={(e) => { e.stopPropagation(); /* TODO: Open Detail */ }}
                                        >
                                            {task.type === 'event' && task.startTime && !task.isAllDay && <span className="opacity-70 mr-1 text-[10px] hidden lg:inline">{task.startTime}</span>}
                                            {task.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CREATE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex justify-center items-end sm:items-center sm:p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full bg-[#121212] rounded-t-2xl sm:rounded-2xl border-t sm:border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-slide-up pb-safe max-h-[90vh] sm:max-w-lg">

                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

                        {/* Modal Header & Tabs */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 shrink-0">
                            <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                                <button
                                    onClick={() => setCreationMode('event')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${creationMode === 'event' ? 'bg-aura-accent text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Evento
                                </button>
                                <button
                                    onClick={() => setCreationMode('task')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${creationMode === 'task' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Tarea
                                </button>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white p-2 rounded-full hover:bg-white/5"><X size={20} /></button>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                            {/* Title */}
                            <div className="space-y-1">
                                <input
                                    type="text"
                                    placeholder={creationMode === 'event' ? "Añade un título" : "Nombre de la tarea"}
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full bg-transparent text-2xl font-bold placeholder-gray-600 border-b border-transparent focus:border-aura-accent outline-none pb-1 transition-colors"
                                    autoFocus
                                />
                            </div>

                            {/* Event Specific Fields */}
                            {creationMode === 'event' && (
                                <>
                                    <div className="flex items-center gap-4 text-sm text-gray-300">
                                        <Clock size={18} className="text-gray-500" />
                                        <div className="flex flex-col gap-2 w-full">
                                            <div className="flex items-center gap-3">
                                                <span>{selectedDay?.toLocaleDateString()}</span>
                                                {!isAllDay && (
                                                    <div className="flex items-center gap-2">
                                                        <input type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-white/5 border border-white/10 rounded px-2 py-1 outline-none focus:border-aura-accent" />
                                                        <span>-</span>
                                                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-white/5 border border-white/10 rounded px-2 py-1 outline-none focus:border-aura-accent" />
                                                    </div>
                                                )}
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer w-fit">
                                                <input type="checkbox" checked={isAllDay} onChange={e => setIsAllDay(e.target.checked)} className="rounded border-gray-600 bg-transparent text-aura-accent focus:ring-0" />
                                                <span className="text-xs text-gray-400">Todo el día</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-300">
                                        <MapPin size={18} className="text-gray-500" />
                                        <input type="text" placeholder="Añadir ubicación" value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-transparent border-b border-white/5 focus:border-aura-accent outline-none py-1 placeholder-gray-600" />
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-300">
                                        <LinkIcon size={18} className="text-gray-500" />
                                        <input type="text" placeholder="Añadir videollamada o link" value={url} onChange={e => setUrl(e.target.value)} className="w-full bg-transparent border-b border-white/5 focus:border-aura-accent outline-none py-1 placeholder-gray-600" />
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-300">
                                        <Users size={18} className="text-gray-500" />
                                        <input type="text" placeholder="Añadir invitados (email) - Mockup" className="w-full bg-transparent border-b border-white/5 focus:border-aura-accent outline-none py-1 placeholder-gray-600" disabled />
                                    </div>
                                </>
                            )}

                            {/* Task Specific Fields */}
                            {creationMode === 'task' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 text-sm text-gray-300">
                                        <Clock size={18} className="text-gray-500" />
                                        <span>{selectedDay?.toLocaleDateString()}</span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-300">
                                        <Flag size={18} className="text-gray-500" />
                                        <div className="flex gap-2">
                                            {(['alta', 'media', 'baja'] as Priority[]).map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setPriority(p)}
                                                    className={`px-3 py-1 rounded-full text-xs capitalize border transition-all ${priority === p ? 'bg-aura-accent/20 border-aura-accent text-aura-accent' : 'border-white/10 hover:bg-white/5 text-gray-400'}`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-300">
                                        <CheckSquare size={18} className="text-gray-500" />
                                        <div className="w-full p-2 bg-white/5 rounded-lg border border-white/5">
                                            <p className="text-xs text-gray-500 mb-1">Proyecto asociado</p>
                                            <select className="w-full bg-transparent outline-none text-white text-sm">
                                                <option value="1">Personal (Por defecto)</option>
                                                <option value="2">Trabajo</option>
                                                <option value="3">Aura</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Common: Description/Notes */}
                            <div className="flex gap-4 text-sm text-gray-300 pt-2">
                                <AlignLeft size={18} className="text-gray-500 mt-1" />
                                <textarea
                                    placeholder={creationMode === 'event' ? "Añadir descripción" : "Añadir notas"}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full bg-white/5 rounded-xl border border-white/5 p-3 min-h-[100px] outline-none focus:border-aura-accent resize-none placeholder-gray-600"
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-white/5 flex justify-end gap-3 bg-black/20 shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">Cancelar</button>
                            <button
                                onClick={handleCreate}
                                className="px-6 py-2 bg-aura-accent text-aura-black rounded-xl font-bold hover:bg-aura-accent/90 transition-all shadow-lg shadow-aura-accent/10"
                            >
                                Guardar {creationMode === 'event' ? 'Evento' : 'Tarea'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;