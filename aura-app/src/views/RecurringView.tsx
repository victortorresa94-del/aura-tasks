import React, { useState } from 'react';
import { Play, CreditCard, ShoppingBag, Dumbbell, Wifi, Plus, DollarSign, Calendar } from 'lucide-react';
import { Task } from '../types';

interface RecurringViewProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
}

const PRESETS = [
  { id: 'netflix', name: 'Netflix', price: 15.99, icon: <Play size={20} />, color: 'bg-red-500', category: 'Suscripción' },
  { id: 'spotify', name: 'Spotify', price: 10.99, icon: <MusicIcon />, color: 'bg-green-500', category: 'Suscripción' },
  { id: 'gym', name: 'Gimnasio', price: 29.99, icon: <Dumbbell size={20} />, color: 'bg-orange-500', category: 'Salud' },
  { id: 'internet', name: 'Internet', price: 39.90, icon: <Wifi size={20} />, color: 'bg-blue-500', category: 'Hogar' },
  { id: 'alquiler', name: 'Alquiler', price: 800, icon: <CreditCard size={20} />, color: 'bg-indigo-500', category: 'Hogar' },
];

function MusicIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>; }

const RecurringView: React.FC<RecurringViewProps> = ({ tasks, onAddTask }) => {
  const recurringTasks = tasks.filter(t => t.isRecurring);
  const [selectedPreset, setSelectedPreset] = useState<typeof PRESETS[0] | null>(null);
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [paymentDay, setPaymentDay] = useState<number>(1);

  const handleAddPreset = () => {
    if (!selectedPreset) return;
    
    // Calculate next date based on payment day
    const today = new Date();
    let nextDate = new Date(today.getFullYear(), today.getMonth(), paymentDay);
    if (nextDate < today) {
      nextDate = new Date(today.getFullYear(), today.getMonth() + 1, paymentDay);
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: `Pagar ${selectedPreset.name}`,
      priority: 'media',
      date: nextDate.toISOString().split('T')[0],
      status: 'pendiente',
      type: 'payment',
      listId: '1', // Default to Personal
      tags: ['recurrente', selectedPreset.category.toLowerCase()],
      isRecurring: true,
      frequency: 'Mensual',
      amount: customPrice || selectedPreset.price,
      currency: '€'
    };

    onAddTask(newTask);
    setSelectedPreset(null);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in-up pb-24">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Tareas Recurrentes</h2>
        <p className="text-gray-500 text-sm">Gestiona tus suscripciones y pagos fijos</p>
      </div>

      {/* Presets Grid */}
      <div className="mb-10">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Añadir Suscripción Rápida</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => { setSelectedPreset(preset); setCustomPrice(preset.price); }}
              className="bg-white p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col items-center gap-3 group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110 ${preset.color}`}>
                {preset.icon}
              </div>
              <div className="text-center">
                <span className="block font-bold text-gray-900">{preset.name}</span>
                <span className="text-xs text-gray-500">{preset.price}€ / mes</span>
              </div>
            </button>
          ))}
          <button className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center gap-3 text-gray-400 hover:text-indigo-600">
             <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-current">
                <Plus size={24} />
             </div>
             <span className="text-sm font-medium">Personalizado</span>
          </button>
        </div>
      </div>

      {/* Configuration Modal */}
      {selectedPreset && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-fade-in-up">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${selectedPreset.color}`}>
                {selectedPreset.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg">Configurar {selectedPreset.name}</h3>
                <p className="text-xs text-gray-500">{selectedPreset.category}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Importe Mensual (€)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="number" 
                    value={customPrice}
                    onChange={(e) => setCustomPrice(parseFloat(e.target.value))}
                    className="w-full pl-9 border border-gray-200 rounded-lg py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Día de pago</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select 
                    value={paymentDay}
                    onChange={(e) => setPaymentDay(parseInt(e.target.value))}
                    className="w-full pl-9 border border-gray-200 rounded-lg py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {[...Array(31)].map((_, i) => (
                      <option key={i+1} value={i+1}>Día {i+1} de cada mes</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button 
                  onClick={() => setSelectedPreset(null)}
                  className="flex-1 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddPreset}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List of Recurring Tasks */}
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Activas ({recurringTasks.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recurringTasks.map(task => (
          <div key={task.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                 <Calendar size={20} />
               </div>
               <div>
                 <h4 className="font-bold text-gray-900">{task.title}</h4>
                 <p className="text-xs text-gray-500">Próximo: {task.date} • {task.amount}€</p>
               </div>
            </div>
            <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {task.frequency}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecurringView;