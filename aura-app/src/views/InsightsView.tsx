import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Trophy, TrendingUp, Target, DollarSign, Calendar, Activity, AlertCircle } from 'lucide-react';
import { Task, Transaction, Habit, Project, TaskStatus } from '../types';

interface InsightsViewProps {
    tasks?: Task[];
    transactions?: Transaction[];
    habits?: Habit[];
    projects?: Project[];
    statuses?: TaskStatus[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#3b82f6'];

export default function InsightsView({
    tasks = [],
    transactions = [],
    habits = [],
    projects = [],
    statuses = []
}: InsightsViewProps) {

    // 1. Productivity Stats
    const stats = useMemo(() => {
        if (!tasks.length) return { completed: 0, pending: 0, completionRate: 0, activityData: [] };

        const completed = tasks.filter(t => {
            const taskStatus = statuses.find(s => s.id === t.status);
            return taskStatus?.isCompleted === true;
        }).length;

        const pending = tasks.length - completed;
        const completionRate = Math.round((completed / tasks.length) * 100);

        // Weekly activity (mock logic for demo purposes, robust enough for now)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toLocaleDateString('es-ES', { weekday: 'short' });
        }).reverse();

        const activityData = last7Days.map(day => ({
            name: day,
            tasks: Math.floor(Math.random() * 5) + (completed > 0 ? 1 : 0) // Mock slightly related to existence of tasks
        }));

        return { completed, pending, completionRate, activityData };
    }, [tasks, statuses]);

    // 2. Project Distribution
    const projectData = useMemo(() => {
        if (!projects.length || !tasks.length) return [];
        return projects.map(p => ({
            name: p.name,
            value: tasks.filter(t => t.listId === p.id).length
        })).filter(d => d.value > 0);
    }, [projects, tasks]);

    // 3. Financial Overview
    const financeData = useMemo(() => {
        if (!transactions.length) return [];
        const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || 0), 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amount || 0), 0);
        return [
            { name: 'Ingresos', value: income, color: '#10b981' },
            { name: 'Gastos', value: expense, color: '#ef4444' }
        ];
    }, [transactions]);

    const netProfit = useMemo(() => {
        if (!financeData.length) return 0;
        const inc = financeData.find(d => d.name === 'Ingresos')?.value || 0;
        const exp = financeData.find(d => d.name === 'Gastos')?.value || 0;
        return inc - exp;
    }, [financeData]);

    // Safe formatter
    const formatCurrency = (val: number) => val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

    return (
        <div className="h-full overflow-y-auto bg-aura-black p-6 space-y-8 animate-fade-in-up custom-scrollbar">

            <header className="mb-8">
                <h2 className="text-2xl font-bold text-aura-white flex items-center gap-3">
                    <Activity className="text-aura-accent" />
                    Insights & Analíticas
                </h2>
                <p className="text-gray-400">Métricas clave sobre tu productividad y negocio.</p>
            </header>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Trophy className="text-yellow-400" size={24} />}
                    label="Tasa de Finalización"
                    value={`${stats.completionRate}%`}
                    trend={stats.completionRate > 50 ? "Buen ritmo" : "Necesita mejora"}
                    theme="yellow"
                />
                <StatCard
                    icon={<Target className="text-aura-accent" size={24} />}
                    label="Tareas Completadas"
                    value={stats.completed}
                    trend={`${stats.pending} pendientes`}
                    theme="indigo"
                />
                <StatCard
                    icon={<DollarSign className="text-emerald-400" size={24} />}
                    label="Balance Mensual"
                    value={financeData.length ? formatCurrency(netProfit) : '0 €'}
                    trend="Beneficio neto"
                    theme="emerald"
                />
                <StatCard
                    icon={<TrendingUp className="text-pink-400" size={24} />}
                    label="Racha Actual"
                    value="12 Días" // Placeholder until habits implementation is solid
                    trend="Hábitos constantes"
                    theme="pink"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Productivity Chart */}
                <div className="bg-aura-gray/20 p-6 rounded-2xl shadow-sm border border-white/5 lg:col-span-2 flex flex-col">
                    <h3 className="text-lg font-bold text-aura-white mb-6 flex items-center gap-2">
                        <Calendar size={20} className="text-gray-500" />
                        Actividad Semanal
                    </h3>

                    <div className="h-64 flex-1 w-full min-h-[200px]">
                        {stats.activityData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.activityData}>
                                    <defs>
                                        <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#D4E157" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#D4E157" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2A33', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#F2F4F6' }}
                                    />
                                    <Area type="monotone" dataKey="tasks" stroke="#D4E157" fillOpacity={1} fill="url(#colorTasks)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState message="No hay suficiente actividad registrada esta semana." />
                        )}
                    </div>
                </div>

                {/* Project Distribution */}
                <div className="bg-aura-gray/20 p-6 rounded-2xl shadow-sm border border-white/5 flex flex-col">
                    <h3 className="text-lg font-bold text-aura-white mb-6">Foco por Proyecto</h3>

                    <div className="h-64 relative flex-1 min-h-[200px]">
                        {projectData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={projectData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {projectData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                    <span className="text-3xl font-bold text-gray-800">{tasks.length}</span>
                                    <span className="text-xs text-gray-400 uppercase font-bold">Tareas</span>
                                </div>
                            </>
                        ) : (
                            <EmptyState message="Crea tareas y asígnalas a proyectos para ver estadísticas." />
                        )}
                    </div>

                    {projectData.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            {projectData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="truncate max-w-[100px]">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Financial Quick View */}
            <div className="bg-aura-gray/20 p-6 rounded-2xl shadow-sm border border-white/5">
                <h3 className="text-lg font-bold text-aura-white mb-6 flex items-center gap-2">
                    <DollarSign size={20} className="text-gray-500" />
                    Resumen Financiero
                </h3>

                {financeData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="h-52 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={financeData} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1F2A33', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: '#F2F4F6' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                        {financeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-400">
                                {netProfit >= 0
                                    ? "Tu balance es positivo. Estás gestionando bien tus finanzas."
                                    : "Tus gastos superan a tus ingresos. Revisa tu presupuesto."}
                            </p>
                            <div className="p-4 bg-aura-black/50 rounded-xl flex items-center justify-between border border-white/5">
                                <span className="text-gray-500 text-sm font-medium">Beneficio Neto</span>
                                <span className={`text-xl font-bold ${netProfit >= 0 ? 'text-aura-white' : 'text-red-400'}`}>
                                    {formatCurrency(netProfit)}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <EmptyState message="Registra ingresos y gastos en la pestaña Planificación para ver tu balance." />
                )}
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function StatCard({ icon, label, value, trend, theme }: {
    icon: React.ReactNode,
    label: string,
    value: string | number,
    trend: string,
    theme: 'indigo' | 'yellow' | 'emerald' | 'pink'
}) {
    const themeStyles = {
        indigo: { bg: 'bg-aura-accent/10', text: 'text-aura-accent', border: 'border-aura-accent/20' },
        yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
        pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
    };

    const style = themeStyles[theme];

    return (
        <div className={`p-6 rounded-2xl bg-aura-gray/20 border ${style.border} shadow-sm flex items-start justify-between group hover:shadow-md transition-shadow relative overflow-hidden`}>
            {/* Background decoration */}
            <div className={`absolute top-0 right-0 w-24 h-24 ${style.bg} rounded-bl-full opacity-20 -mr-6 -mt-6 transition-transform group-hover:scale-110`}></div>

            <div className="relative z-10">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-2xl font-bold text-aura-white my-1">{value}</p>
                <p className={`text-xs font-medium ${style.text} opacity-90`}>{trend}</p>
            </div>
            <div className={`p-3 rounded-xl ${style.bg} relative z-10 opacity-80`}>
                {icon}
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white/5 rounded-xl border border-dashed border-white/10">
            <div className="bg-white/10 p-3 rounded-full mb-3 text-gray-400">
                <AlertCircle size={24} />
            </div>
            <p className="text-sm text-gray-400 max-w-[200px]">{message}</p>
        </div>
    );
}
