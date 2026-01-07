import React, { useState } from 'react';
import { Wallet, Target, Repeat, Plus, TrendingUp, TrendingDown, DollarSign, CheckCircle2, Calendar as CalendarIcon, CreditCard, Zap, Edit3, Tv, Music, Bot, ShoppingBag, Palette, Video, Cloud, Home, Wifi, Dumbbell, Car, Phone } from 'lucide-react';
import { Transaction, Habit, Task, Subscription, RecurringExpense } from '../types';
import CalendarView from './CalendarView';

interface PlanningViewProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
}

const getServiceStyle = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('netflix')) return { bg: 'bg-red-600', text: 'text-white', icon: <Tv size={20} /> };
  if (n.includes('spotify')) return { bg: 'bg-[#1DB954]', text: 'text-black', icon: <Music size={20} /> };
  if (n.includes('chatgpt') || n.includes('openai')) return { bg: 'bg-[#74AA9C]', text: 'text-white', icon: <Bot size={20} /> };
  if (n.includes('prime') || n.includes('amazon')) return { bg: 'bg-[#00A8E1]', text: 'text-white', icon: <ShoppingBag size={20} /> };
  if (n.includes('adobe') || n.includes('photoshop')) return { bg: 'bg-[#FF0000]', text: 'text-white', icon: <Palette size={20} /> };
  if (n.includes('youtube')) return { bg: 'bg-[#FF0000]', text: 'text-white', icon: <Video size={20} /> };
  if (n.includes('icloud') || n.includes('apple')) return { bg: 'bg-gray-500', text: 'text-white', icon: <Cloud size={20} /> };
  if (n.includes('alquiler') || n.includes('casa') || n.includes('piso')) return { bg: 'bg-indigo-600', text: 'text-white', icon: <Home size={20} /> };
  if (n.includes('internet') || n.includes('wifi') || n.includes('fibra')) return { bg: 'bg-blue-600', text: 'text-white', icon: <Wifi size={20} /> };
  if (n.includes('gimnasio') || n.includes('gym') || n.includes('crossfit')) return { bg: 'bg-orange-600', text: 'text-white', icon: <Dumbbell size={20} /> };
  if (n.includes('coche') || n.includes('seguro') || n.includes('gasolina')) return { bg: 'bg-pink-600', text: 'text-white', icon: <Car size={20} /> };
  if (n.includes('movil') || n.includes('telefono')) return { bg: 'bg-green-600', text: 'text-white', icon: <Phone size={20} /> };

  // Default
  return { bg: 'bg-gray-800', text: 'text-gray-300', icon: <span className="text-sm font-bold">{name.substring(0, 2).toUpperCase()}</span> };
};

const PlanningView: React.FC<PlanningViewProps> = ({ tasks, onAddTask, transactions, setTransactions, habits, setHabits }) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'finance' | 'habits' | 'projects'>('calendar');

  // Modals State
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);

  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [manualBalance, setManualBalance] = useState<number | null>(null);

  // Forms State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  // Subscription Form
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subDate, setSubDate] = useState('');
  const [subFreq, setSubFreq] = useState('monthly');

  // Recurring Form
  const [recName, setRecName] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recPayDay, setRecPayDay] = useState('');

  // Mock Data for Finance
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    { id: '1', name: 'Netflix', amount: 15.99, currency: '€', frequency: 'monthly', nextPaymentDate: '2025-02-15', category: 'Ocio', status: 'active' },
    { id: '2', name: 'Spotify', amount: 9.99, currency: '€', frequency: 'monthly', nextPaymentDate: '2025-02-10', category: 'Ocio', status: 'active' },
    { id: '3', name: 'ChatGPT Plus', amount: 20.00, currency: '$', frequency: 'monthly', nextPaymentDate: '2025-02-05', category: 'IA', status: 'active' },
  ]);

  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([
    { id: '1', name: 'Alquiler', amount: 850, category: 'Vivienda', frequency: 'monthly', payDay: 1 },
    { id: '2', name: 'Internet', amount: 45, category: 'Servicios', frequency: 'monthly', payDay: 15 },
  ]);

  const calculatedBalance = transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  const currentBalance = manualBalance !== null ? manualBalance : calculatedBalance;

  const totalSubscriptions = subscriptions.reduce((acc, s) => acc + s.amount, 0); // Simplified currency sum
  const totalRecurring = recurringExpenses.reduce((acc, r) => acc + r.amount, 0);
  const fixedMonthly = totalSubscriptions + totalRecurring;

  // --- Handlers ---
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
    setAmount(''); setDescription(''); setCategory('');
  };

  const handleAddSubscription = () => {
    if (!subName || !subAmount || !subDate) return;
    const newSub: Subscription = {
      id: Date.now().toString(),
      name: subName,
      amount: parseFloat(subAmount),
      currency: '€',
      frequency: subFreq,
      nextPaymentDate: subDate,
      category: 'General',
      status: 'active'
    };
    setSubscriptions(prev => [...prev, newSub]);
    setShowSubModal(false);
    setSubName(''); setSubAmount(''); setSubDate('');
  };

  const handleAddRecurring = () => {
    if (!recName || !recAmount || !recPayDay) return;
    const newRec: RecurringExpense = {
      id: Date.now().toString(),
      name: recName,
      amount: parseFloat(recAmount),
      frequency: 'monthly',
      category: 'Fijo',
      payDay: parseInt(recPayDay)
    };
    setRecurringExpenses(prev => [...prev, newRec]);
    setShowRecurringModal(false);
    setRecName(''); setRecAmount(''); setRecPayDay('');
  };

  const openTransactionModal = (type: 'income' | 'expense') => {
    setTransactionType(type);
    setShowTransactionModal(true);
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 space-y-6 overflow-hidden relative bg-aura-black text-aura-white">
      {/* Top Navigation */}
      <div className="flex gap-4 border-b border-white/5 overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: 'calendar', label: 'Calendario', icon: <CalendarIcon size={16} /> },
          { id: 'finance', label: 'Finanzas', icon: <Wallet size={16} /> },
          { id: 'habits', label: 'Hábitos', icon: <Repeat size={16} /> },
          { id: 'projects', label: 'Proyectos', icon: <Target size={16} /> },
        ].map(tab => (
          <button
            key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${activeTab === tab.id ? 'border-aura-accent text-aura-accent' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
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
            {/* Finance Dashboard Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Balance Card */}
              <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-black p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Wallet size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-400 font-medium">Balance Total</p>
                    {isEditingBalance ? (
                      <div className="flex items-center gap-2 bg-black/50 rounded-lg p-1 border border-white/20">
                        <input
                          type="number"
                          value={manualBalance || ''}
                          onChange={e => setManualBalance(parseFloat(e.target.value))}
                          className="bg-transparent w-24 text-right text-white outline-none"
                          placeholder="Saldo"
                          autoFocus
                        />
                        <button onClick={() => setIsEditingBalance(false)} className="text-green-400"><CheckCircle2 size={16} /></button>
                      </div>
                    ) : (
                      <button onClick={() => setIsEditingBalance(true)} className="text-gray-600 hover:text-white transition-colors" title="Ajuste manual">
                        <Edit3 size={16} />
                      </button>
                    )}
                  </div>
                  <h2 className={`text-5xl font-bold mb-6 ${currentBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
                    {currentBalance.toLocaleString()}€
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-gray-500 uppercase mb-1">Ingresos (Mes)</p>
                      <p className="text-xl font-bold text-emerald-400">+{transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0)}€</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-xs text-gray-500 uppercase mb-1">Gastos (Mes)</p>
                      <p className="text-xl font-bold text-red-400">-{transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0)}€</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Bank Mock */}
              <div className="space-y-4">
                {/* Bank Connect */}
                <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><CreditCard size={20} /></div>
                    <div>
                      <p className="font-bold text-blue-100 text-sm">Banco Santander</p>
                      <p className="text-[10px] text-blue-300">Conectado • Hace 2h</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white text-sm">2.450€</p>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">LIVE</span>
                  </div>
                </div>

                {/* Fixed Costs Summary */}
                <div className="bg-aura-gray/20 border border-white/5 p-4 rounded-2xl">
                  <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2"><Zap size={14} className="text-yellow-500" /> Gastos Fijos Estimados</h4>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold text-white">{fixedMonthly.toFixed(2)}€<span className="text-sm text-gray-500 font-normal">/mes</span></p>
                      <p className="text-xs text-gray-500 mt-1">{subscriptions.length} suscripciones • {recurringExpenses.length} fijos</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => openTransactionModal('income')} className="flex-1 bg-emerald-500/10 text-emerald-400 py-3 rounded-xl font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm">
                    <Plus size={16} /> Ingreso
                  </button>
                  <button onClick={() => openTransactionModal('expense')} className="flex-1 bg-red-500/10 text-red-400 py-3 rounded-xl font-bold border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 text-sm">
                    <Plus size={16} /> Gasto
                  </button>
                </div>
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscriptions */}
              <div className="bg-aura-gray/20 rounded-3xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <h3 className="font-bold text-white flex items-center gap-2"><Repeat size={18} className="text-purple-400" /> Suscripciones</h3>
                  <button onClick={() => setShowSubModal(true)} className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-white transition-colors">+ Añadir</button>
                </div>
                <div className="p-4 space-y-2">
                  {subscriptions.map(sub => {
                    const style = getServiceStyle(sub.name);
                    return (
                      <div key={sub.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-white/10 ${style.bg} ${style.text}`}>
                            {style.icon}
                          </div>
                          <div>
                            <p className="font-bold text-gray-200 text-sm">{sub.name}</p>
                            <p className="text-[10px] text-gray-500">{sub.category} • Prox: {new Date(sub.nextPaymentDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white text-sm">{sub.amount}{sub.currency}</p>
                          <p className="text-[10px] text-gray-500 capitalize">{sub.frequency}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recurring Expenses */}
              <div className="bg-aura-gray/20 rounded-3xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <h3 className="font-bold text-white flex items-center gap-2"><Zap size={18} className="text-orange-400" /> Gastos Recurrentes</h3>
                  <button onClick={() => setShowRecurringModal(true)} className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-white transition-colors">+ Añadir</button>
                </div>
                <div className="p-4 space-y-2">
                  {recurringExpenses.map(exp => {
                    const style = getServiceStyle(exp.name);
                    return (
                      <div key={exp.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-white/10 ${style.bg} ${style.text}`}>
                            {style.icon}
                          </div>
                          <div>
                            <p className="font-bold text-gray-200 text-sm">{exp.name}</p>
                            <p className="text-[10px] text-gray-500">{exp.category} • Día {exp.payDay}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white text-sm">{exp.amount}€</p>
                          <p className="text-[10px] text-gray-500">Estimado</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="bg-aura-gray/10 rounded-3xl border border-white/5 p-6">
              <h3 className="font-bold text-gray-400 text-sm uppercase tracking-widest mb-4">Últimos movimientos</h3>
              <div className="space-y-2">
                {transactions.length === 0 ? <p className="text-gray-600 italic text-sm">Sin movimientos</p> :
                  transactions.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {t.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-300 text-sm">{t.description}</p>
                          <p className="text-[10px] text-gray-600">{t.category} • {t.date}</p>
                        </div>
                      </div>
                      <span className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.type === 'income' ? '+' : '-'}{t.amount}€
                      </span>
                    </div>
                  ))
                }
              </div>
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
                className="text-aura-accent p-2 hover:bg-aura-accent/10 rounded-xl transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
            {habits.length === 0 ? (
              <div className="bg-aura-gray/20 p-12 rounded-3xl border border-dashed border-white/10 text-center text-gray-400">
                <Repeat size={40} className="mx-auto mb-4 opacity-20" />
                <p>Establece hábitos para tu crecimiento</p>
              </div>
            ) : habits.map(habit => (
              <div key={habit.id} className="bg-aura-gray/20 p-5 rounded-2xl border border-white/5 flex items-center justify-between shadow-sm group hover:border-aura-accent/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold border border-orange-500/20">
                    {habit.streak}
                  </div>
                  <div>
                    <h4 className="font-bold text-aura-white">{habit.name}</h4>
                    <p className="text-xs text-gray-400 capitalize">{habit.frequency}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Simple increment logic for demo
                    setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, streak: h.streak + 1 } : h));
                  }}
                  className="p-3 bg-white/5 text-gray-400 rounded-xl hover:bg-aura-accent hover:text-aura-black transition-all"
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
              <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-6 rounded-3xl text-white shadow-lg border border-indigo-500/20">
                <h4 className="text-lg font-bold mb-1">Lanzamiento App</h4>
                <p className="text-indigo-200 text-xs opacity-80 mb-6">Objetivo: Q4 2025</p>
                <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mb-2">
                  <div className="bg-aura-accent h-full" style={{ width: '65%' }} />
                </div>
                <p className="text-[10px] font-bold text-right uppercase tracking-widest text-indigo-300">65% completado</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-aura-black rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-white/10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-aura-white">
              {transactionType === 'income' ? <TrendingUp className="text-emerald-400" /> : <TrendingDown className="text-red-400" />}
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
                  className="w-full text-2xl font-bold bg-transparent border-b border-white/10 py-2 focus:border-aura-accent outline-none text-aura-white placeholder:text-gray-700"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-white/10 bg-aura-gray/20 rounded-lg px-3 py-2 mt-1 focus:ring-1 focus:ring-aura-accent outline-none text-aura-white"
                  placeholder="Ej: Nómina, Supermercado..."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-white/10 bg-aura-gray/20 rounded-lg px-3 py-2 mt-1 focus:ring-1 focus:ring-aura-accent outline-none text-aura-white"
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
              <button onClick={() => setShowTransactionModal(false)} className="flex-1 py-2 text-gray-400 font-bold hover:bg-white/5 rounded-xl transition-colors">Cancelar</button>
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

      {/* Subscription Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-aura-black rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-white/10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-aura-white">
              <Repeat className="text-purple-400" /> Añadir Suscripción
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
                <input type="text" value={subName} onChange={e => setSubName(e.target.value)} className="w-full bg-transparent border-b border-white/10 py-2 focus:border-aura-accent outline-none text-aura-white" placeholder="Ej: Netflix" autoFocus />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Precio (€)</label>
                <input type="number" value={subAmount} onChange={e => setSubAmount(e.target.value)} className="w-full bg-transparent border-b border-white/10 py-2 focus:border-aura-accent outline-none text-aura-white" placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Próximo Pago</label>
                <input type="date" value={subDate} onChange={e => setSubDate(e.target.value)} className="w-full bg-transparent border-b border-white/10 py-2 focus:border-aura-accent outline-none text-aura-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowSubModal(false)} className="flex-1 py-2 text-gray-400 font-bold hover:bg-white/5 rounded-xl">Cancelar</button>
              <button onClick={handleAddSubscription} className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Expense Modal */}
      {showRecurringModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-aura-black rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-white/10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-aura-white">
              <Zap className="text-orange-400" /> Añadir Gasto Fijo
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
                <input type="text" value={recName} onChange={e => setRecName(e.target.value)} className="w-full bg-transparent border-b border-white/10 py-2 focus:border-aura-accent outline-none text-aura-white" placeholder="Ej: Alquiler" autoFocus />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Importe (€)</label>
                <input type="number" value={recAmount} onChange={e => setRecAmount(e.target.value)} className="w-full bg-transparent border-b border-white/10 py-2 focus:border-aura-accent outline-none text-aura-white" placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Día de cobro (1-31)</label>
                <input type="number" min="1" max="31" value={recPayDay} onChange={e => setRecPayDay(e.target.value)} className="w-full bg-transparent border-b border-white/10 py-2 focus:border-aura-accent outline-none text-aura-white" placeholder="Ej: 1" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowRecurringModal(false)} className="flex-1 py-2 text-gray-400 font-bold hover:bg-white/5 rounded-xl">Cancelar</button>
              <button onClick={handleAddRecurring} className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningView;