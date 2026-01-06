import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Trophy, TrendingUp, Target, DollarSign, Calendar, Activity } from 'lucide-react';
import { Task, Transaction, Habit, Project, TaskStatus } from '../types';

interface InsightsViewProps {
    tasks: Task[];
    transactions: Transaction[];
    habits: Habit[];
    projects: Project[];
    statuses: TaskStatus[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#3b82f6'];

export default function InsightsView({ tasks, transactions, habits, projects, statuses }: InsightsViewProps) {

    // 1. Productivity Stats
    const stats = useMemo(() => {
        const completed = tasks.filter(t => {
            const taskStatus = statuses.find(s => s.id === t.status);
            return taskStatus?.isCompleted === true;
        }).length;
        const pending = tasks.filter(t => {
            const taskStatus = statuses.find(s => s.id === t.status);
            return taskStatus?.isCompleted !== true;
        }).length;
        const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

        // Weekly activity (mock data for now based on tasks dates if available, or random distribution)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toLocaleDateString('es-ES', { weekday: 'short' });
        }).reverse();

        const activityData = last7Days.map(day => ({
            name: day,
            tasks: Math.floor(Math.random() * 5) + 1 // Mock activity for visual demo
        }));

        return { completed, pending, completionRate, activityData };
    }, [tasks]);

    // 2. Project Distribution
    const projectData = useMemo(() => {
        return projects.map(p => ({
            name: p.name,
            value: tasks.filter(t =>
                // Logic to link task to project (conceptual, using listId or tags)
                t.listId === p.id || t.tags.includes(p.id)
            ).length
        })).filter(d => d.value > 0);
    }, [projects, tasks]);

    // 3. Financial Overview
    const financeData = useMemo(() => {
        // Group transactions by month or category
        // For this demo, we'll show a simple Income vs Expense
        const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        return [
            { name: 'Ingresos', value: income, color: '#10b981' },
            { name: 'Gastos', value: expense, color: '#ef4444' }
        ];
    }, [transactions]);

    return (
        <div className="h-full overflow-y-auto bg-gray-50/50 p-6 space-y-8 animate-fade-in-up">

            <header className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Activity className="text-indigo-600" />
                    Insights & Analíticas
                </h2>
                <p className="text-gray-500">Métricas clave sobre tu productividad y negocio.</p>
            </header>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Trophy className="text-yellow-600" size={24} />}
                    label="Tasa de Finalización"
                    value={`${stats.completionRate}%`}
                    trend="+5% vs semana pasada"
                    color="bg-yellow-50 text-yellow-700"
                />
                <StatCard
                    icon={<Target className="text-indigo-600" size={24} />}
                    label="Tareas Completadas"
                    value={stats.completed}
                    trend={`${stats.pending} pendientes`}
                    color="bg-indigo-50 text-indigo-700"
                />
                <StatCard
                    icon={<DollarSign className="text-emerald-600" size={24} />}
                    label="Balance Mensual"
                    value={`${(12500).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`}
                    trend="+12% beneficio"
                    color="bg-emerald-50 text-emerald-700"
                />
                <StatCard
                    icon={<TrendingUp className="text-pink-600" size={24} />}
                    label="Racha Actual"
                    value="12 Días"
                    trend="Hábitos constantes"
                    color="bg-pink-50 text-pink-700"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Productivity Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Calendar size={20} className="text-gray-400" />
                        Actividad Semanal
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.activityData}>
                                <defs>
                                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="tasks" stroke="#6366f1" fillOpacity={1} fill="url(#colorTasks)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Project Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Foco por Proyecto</h3>
                    <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={projectData.length ? projectData : [{ name: 'Sin datos', value: 1 }]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(projectData.length ? projectData : [{ name: 'Sin datos', value: 1 }]).map((entry, index) => (
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
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {projectData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                {entry.name}
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Financial Quick View */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <DollarSign size={20} className="text-gray-400" />
                    Resumen Financiero
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={financeData} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                                    {financeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Tu balance es positivo este mes. Los ingresos por servicios superan a los gastos operativos en un <span className="text-emerald-600 font-bold">12%</span>.
                        </p>
                        <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                            <span className="text-gray-500 text-sm font-medium">Beneficio Neto Estimado</span>
                            <span className="text-xl font-bold text-gray-900">
                                {((financeData[0]?.value || 0) - (financeData[1]?.value || 0)).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, trend, color }: { icon: React.ReactNode, label: string, value: string | number, trend: string, color: string }) {
    return (
        <div className={`p-6 rounded-2xl ${color.replace('text-', 'bg-').split(' ')[0]} bg-white border border-gray-100 shadow-sm flex items-start justify-between group hover:shadow-md transition-shadow`}>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900 my-1">{value}</p>
                <p className={`text-xs font-medium ${color.split(' ')[1]} opacity-80`}>{trend}</p>
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                {icon}
            </div>
        </div>
    );
}
