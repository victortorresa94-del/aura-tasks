import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Plus, X } from 'lucide-react';
import { Task } from '../types';

interface CalendarViewProps {
  tasks: Task[];
  onAddTask?: (task: Task) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onAddTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [isEventMode, setIsEventMode] = useState(false);

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0 is Sunday

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDay(dateStr);
    setNewEventTitle('');
    setIsEventMode(false);
  };

  const handleAddItem = () => {
    if (!newEventTitle.trim() || !selectedDay || !onAddTask) return;

    const newTask: Task = {
        id: Date.now().toString(),
        title: newEventTitle,
        priority: 'media',
        date: selectedDay,
        status: 'pendiente',
        type: isEventMode ? 'event' : 'normal',
        listId: '1',
        tags: isEventMode ? ['evento'] : [],
        eventDate: isEventMode ? selectedDay : undefined
    };
    onAddTask(newTask);
    setSelectedDay(null);
  };

  const renderDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);
    const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

    // Placeholders
    for (let i = 0; i < adjustedStartDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[120px] bg-gray-50/30 border border-gray-100/50"></div>);
    }

    // Days
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayTasks = tasks.filter(t => t.date === dateStr);
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <div 
            key={i} 
            onClick={() => handleDayClick(i)}
            className={`min-h-[80px] sm:min-h-[120px] border border-gray-100 bg-white p-1 sm:p-2 overflow-hidden hover:bg-gray-50 transition-colors relative group cursor-pointer ${isToday ? 'bg-indigo-50/30' : ''}`}
        >
          <div className="flex justify-center sm:justify-between items-center mb-1">
             <span className={`text-xs sm:text-sm font-medium w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700'}`}>
               {i}
             </span>
             <button className="hidden sm:block opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-indigo-600 transition-all">
                <Plus size={14} />
             </button>
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[50px] sm:max-h-[calc(100%-24px)] custom-scrollbar">
            {dayTasks.map(task => (
              <div 
                key={task.id} 
                className={`text-[8px] sm:text-xs truncate px-1 py-0.5 sm:py-1 rounded border-l-2 shadow-sm
                  ${task.type === 'event' 
                    ? 'bg-purple-100 text-purple-800 border-purple-500 font-bold' 
                    : task.status === 'completada' 
                      ? 'bg-gray-100 text-gray-400 border-gray-300 line-through hidden sm:block' 
                      : 'bg-indigo-50 text-indigo-700 border-indigo-400'}
                `}
                title={task.title}
              >
                {task.type === 'event' ? '📅 ' : ''}{task.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="p-2 sm:p-6 h-full flex flex-col animate-fade-in-up relative">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
           <h2 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
             <CalIcon className="text-indigo-600" size={20} />
             {monthNames[currentDate.getMonth()]} <span className="text-gray-400 font-light">{currentDate.getFullYear()}</span>
           </h2>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <button onClick={prevMonth} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg border border-gray-200 text-gray-600">
            <ChevronLeft size={18} />
          </button>
          <button onClick={nextMonth} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg border border-gray-200 text-gray-600">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-7 gap-px mb-1 sm:mb-2">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
          <div key={day} className="text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1">
        {renderDays()}
      </div>

      {/* Add Item Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm" onClick={() => setSelectedDay(null)}>
           <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in-up scale-100" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-gray-900">Añadir el {new Date(selectedDay).toLocaleDateString()}</h3>
                 <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
              </div>
              
              <input 
                autoFocus
                type="text"
                placeholder="Título..."
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddItem();
                  if (e.key === 'Escape') setSelectedDay(null);
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
              />

              <div className="flex items-center justify-between mb-6">
                 <span className="text-sm text-gray-600 font-medium">¿Es un evento?</span>
                 <button 
                   onClick={() => setIsEventMode(!isEventMode)}
                   className={`w-12 h-7 rounded-full transition-colors relative ${isEventMode ? 'bg-purple-500' : 'bg-gray-200'}`}
                 >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${isEventMode ? 'left-6' : 'left-1'}`}></div>
                 </button>
              </div>

              <button 
                onClick={handleAddItem}
                disabled={!newEventTitle.trim()}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Crear {isEventMode ? 'Evento' : 'Tarea'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;