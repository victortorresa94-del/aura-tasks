import React, { useState } from 'react';
import { Wallet, Target, Repeat, Plus, TrendingUp, TrendingDown, DollarSign, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { Transaction, Habit, Task } from '../types';
import CalendarView from './CalendarView';

interface PlanningViewProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
}

const PlanningView: React.FC<PlanningViewProps> = ({ tasks, onAddTask, transactions, setTransactions, habits, setHabits }) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'finance' | 'habits' | 'projects'>('calendar');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');

  // Transaction Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const totalBalance = transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);

  const handleAddTransaction = () => {
    if (!amount || !description || !category) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: transactionType,
      amount: parseFloat(amount),
      category,
      description,
      date: new Date().toISOString().split('T')[0]
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setShowTransactionModal(false);
    setAmount('');
    setDescription('');
    setCategory('');
  };

  const openTransactionModal = (type: 'income' | 'expense') => {
    setTransactionType(type);
    setShowTransactionModal(true);
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 space-y-6 overflow-hidden relative">
      <div className="flex gap-4 border-b border-gray-100 overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: 'calendar', label: 'Calendario', icon: <CalendarIcon size={16} /> },
          { id: 'finance', label: 'Finanzas', icon: <Wallet size={16} /> },
          { id: 'habits', label: 'Hábitos', icon: <Repeat size={16} /> },
          { id: 'projects', label: 'Proyectos', icon: <Target size={16} /> },
        ].map(tab => (
          <button
            key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'
              }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'calendar' && (
          <CalendarView tasks={tasks} onAddTask={onAddTask} />
        )}

        {activeTab === 'finance' && (
          <div className="space-y-6 animate-fade-in-up pb-24">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
              <p className="text-gray-400 text-sm font-medium mb-1">Balance Total</p>
              <h2 className={`text-4xl font-bold ${totalBalance >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                {totalBalance.toLocaleString()}€
              </h2>
              <div className="flex gap-4 mt-8 justify-center">
                <button
                  onClick={() => openTransactionModal('income')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 rounded-2xl font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors"
                >
                  <TrendingUp size={18} /> Ingreso
                </button>
                <button
                  onClick={() => openTransactionModal('expense')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-700 rounded-2xl font-bold border border-red-100 hover:bg-red-100 transition-colors"
                >
                  <TrendingDown size={18} /> Gasto
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Movimientos recientes</h3>
              {transactions.length === 0 ? (
                <p className="text-center py-10 text-gray-400 italic">No hay transacciones registradas</p>
              ) : transactions.map(t => (
                <div key={t.id} className="bg-white p-4 rounded-2xl border border-gray-50 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{t.description}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{t.category}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'}{t.amount}€
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'habits' && (
          <div className="space-y-4 animate-fade-in-up pb-24">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Rachas actuales</h3>
              <button
                onClick={() => {
                  const name = prompt("Nombre del hábito:");
                  if (name) setHabits(prev => [...prev, { id: Date.now().toString(), name, frequency: 'daily', streak: 0, completedDays: [] }]);
                }}
                className="text-indigo-600 p-2 hover:bg-indigo-50 rounded-xl transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
            {habits.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
                <Repeat size={40} className="mx-auto mb-4 opacity-20" />
                <p>Establece hábitos para tu crecimiento</p>
              </div>
            ) : habits.map(habit => (
              <div key={habit.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                    {habit.streak}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{habit.name}</h4>
                    <p className="text-xs text-gray-500 capitalize">{habit.frequency}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Simple increment logic for demo
                    setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, streak: h.streak + 1 } : h));
                  }}
                  className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <CheckCircle2 size={24} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-6 animate-fade-in-up pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-100">
                <h4 className="text-lg font-bold mb-1">Lanzamiento App</h4>
                <p className="text-indigo-100 text-xs opacity-80 mb-6">Objetivo: Q4 2025</p>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mb-2">
                  <div className="bg-white h-full" style={{ width: '65%' }} />
                </div>
                <p className="text-[10px] font-bold text-right uppercase tracking-widest">65% completado</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              {transactionType === 'income' ? <TrendingUp className="text-emerald-500" /> : <TrendingDown className="text-red-500" />}
              {transactionType === 'income' ? 'Añadir Ingreso' : 'Añadir Gasto'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Cantidad (€)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  className="w-full text-2xl font-bold border-b border-gray-200 py-2 focus:border-indigo-500 outline-none text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-100 outline-none"
                  placeholder="Ej: Nómina, Supermercado..."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-100 outline-none bg-white"
                >
                  <option value="">Seleccionar...</option>
                  {transactionType === 'income'
                    ? ['Sueldo', 'Freelance', 'Inversiones', 'Regalo', 'Otros'].map(c => <option key={c} value={c}>{c}</option>)
                    : ['Hogar', 'Comida', 'Transporte', 'Ocio', 'Salud', 'Educación', 'Otros'].map(c => <option key={c} value={c}>{c}</option>)
                  }
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowTransactionModal(false)} className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
              <button
                onClick={handleAddTransaction}
                className={`flex-1 py-2 text-white font-bold rounded-xl shadow-md transition-all ${transactionType === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningView;