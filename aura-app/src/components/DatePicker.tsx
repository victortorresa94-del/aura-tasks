import React from 'react';
import { Calendar as CalendarIcon, Sun, Sunrise, CalendarDays, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  currentDate: string;
  onChange: (date: string) => void;
  onClose: () => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ currentDate, onChange, onClose }) => {
  const handleShortcut = (type: 'today' | 'tomorrow' | 'nextWeek' | 'nextWeekend') => {
    const d = new Date();
    if (type === 'tomorrow') d.setDate(d.getDate() + 1);
    if (type === 'nextWeek') d.setDate(d.getDate() + 7);
    if (type === 'nextWeekend') {
       const day = d.getDay();
       const diff = 6 - day + (day === 6 ? 7 : 0); // Next Saturday
       d.setDate(d.getDate() + diff);
    }
    onChange(d.toISOString().split('T')[0]);
    onClose();
  };

  return (
    <div className="absolute z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-72 mt-2 animate-fade-in-up">
      <div className="space-y-2 mb-4">
        <button onClick={() => handleShortcut('today')} className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 group">
          <div className="flex items-center gap-3">
            <Sun size={16} className="text-amber-500" />
            <span>Hoy</span>
          </div>
          <span className="text-xs text-gray-400 group-hover:text-gray-600">
            {new Date().toLocaleDateString('es-ES', { weekday: 'short' })}
          </span>
        </button>
        <button onClick={() => handleShortcut('tomorrow')} className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 group">
          <div className="flex items-center gap-3">
            <Sunrise size={16} className="text-indigo-500" />
            <span>Mañana</span>
          </div>
          <span className="text-xs text-gray-400 group-hover:text-gray-600">
             {new Date(Date.now() + 86400000).toLocaleDateString('es-ES', { weekday: 'short' })}
          </span>
        </button>
        <button onClick={() => handleShortcut('nextWeek')} className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 group">
          <div className="flex items-center gap-3">
            <CalendarDays size={16} className="text-purple-500" />
            <span>Semana que viene</span>
          </div>
          <span className="text-xs text-gray-400 group-hover:text-gray-600">Lun.</span>
        </button>
      </div>

      <div className="border-t border-gray-100 pt-3">
         <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Elegir fecha</label>
         <input 
           type="date"
           value={currentDate}
           onChange={(e) => { onChange(e.target.value); onClose(); }}
           className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
         />
      </div>
    </div>
  );
};

export default DatePicker;