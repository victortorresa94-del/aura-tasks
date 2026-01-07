import React from 'react';
import { LayoutDashboard, CheckSquare, StickyNote, TrendingUp, Calendar } from 'lucide-react';
import { Task, Note } from '../types';

interface DashboardViewProps {
    tasks: Task[];
    notes: Note[];
}

export default function DashboardView({ tasks, notes }: DashboardViewProps) {
    // Get today's tasks
    const today = new Date().toISOString().split('T')[0];
    const todaysTasks = tasks.filter(t => t.date.startsWith(today));
    const completedToday = todaysTasks.filter(t => t.status === 'done').length;
    const pendingToday = todaysTasks.filter(t => t.status !== 'done').length;

    return (
        <div className="h-full flex flex-col bg-aura-black overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-8">
                <div className="flex items-center gap-3 mb-2">
                    <LayoutDashboard className="text-aura-accent" size={32} />
                    <h1 className="text-4xl font-bold text-aura-white">Inicio</h1>
                </div>
                <p className="text-gray-400">Bienvenido de nuevo. Aquí está tu resumen de hoy.</p>
            </div>

            {/* Stats Grid */}
            <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Today's Tasks */}
                    <div className="bg-aura-gray/20 rounded-2xl border border-white/5 p-6 hover:border-aura-accent/20 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <CheckSquare className="text-blue-400" size={24} />
                            <span className="text-3xl font-bold text-aura-white">{todaysTasks.length}</span>
                        </div>
                        <h3 className="font-semibold text-gray-300">Para Hoy</h3>
                        <p className="text-xs text-gray-500 mt-1">{pendingToday} pendientes</p>
                    </div>

                    {/* Completed */}
                    <div className="bg-aura-gray/20 rounded-2xl border border-white/5 p-6 hover:border-aura-accent/20 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                                <CheckSquare className="text-green-400" size={14} />
                            </div>
                            <span className="text-3xl font-bold text-green-400">{completedToday}</span>
                        </div>
                        <h3 className="font-semibold text-gray-300">Completadas</h3>
                        <p className="text-xs text-gray-500 mt-1">Hoy</p>
                    </div>

                    {/* Total Tasks */}
                    <div className="bg-aura-gray/20 rounded-2xl border border-white/5 p-6 hover:border-aura-accent/20 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <TrendingUp className="text-purple-400" size={24} />
                            <span className="text-3xl font-bold text-aura-white">{tasks.length}</span>
                        </div>
                        <h3 className="font-semibold text-gray-300">Total Tareas</h3>
                        <p className="text-xs text-gray-500 mt-1">En el sistema</p>
                    </div>

                    {/* Notes */}
                    <div className="bg-aura-gray/20 rounded-2xl border border-white/5 p-6 hover:border-aura-accent/20 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <StickyNote className="text-yellow-400" size={24} />
                            <span className="text-3xl font-bold text-aura-white">{notes.length}</span>
                        </div>
                        <h3 className="font-semibold text-gray-300">Notas</h3>
                        <p className="text-xs text-gray-500 mt-1">Documentadas</p>
                    </div>
                </div>
            </div>

            {/* Today's Tasks List */}
            <div className="px-6 pb-8">
                <h2 className="text-xl font-bold text-aura-white mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-aura-accent" />
                    Tareas para Hoy
                </h2>
                <div className="bg-aura-gray/20 rounded-2xl border border-white/5 overflow-hidden">
                    {todaysTasks.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>No tienes tareas programadas para hoy.</p>
                            <p className="text-sm mt-2">¡Disfruta tu día libre! 🎉</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {todaysTasks.slice(0, 10).map(task => (
                                <div key={task.id} className="p-4 hover:bg-white/5 transition-colors flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-500'} shrink-0`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium ${task.status === 'done' ? 'line-through text-gray-500' : 'text-aura-white'} truncate`}>
                                            {task.title}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${task.priority === 'alta' ? 'bg-red-500/20 text-red-300' :
                                        task.priority === 'media' ? 'bg-yellow-500/20 text-yellow-300' :
                                            'bg-white/5 text-gray-400'
                                        }`}>
                                        {task.priority}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Notes */}
            {notes.length > 0 && (
                <div className="px-6 pb-8">
                    <h2 className="text-xl font-bold text-aura-white mb-4 flex items-center gap-2">
                        <StickyNote size={20} className="text-yellow-500" />
                        Notas Recientes
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notes.slice(0, 6).map(note => (
                            <div key={note.id} className="bg-aura-gray/20 rounded-xl border border-white/5 p-4 hover:border-aura-accent/30 transition-all">
                                <h3 className="font-bold text-gray-200 mb-2 truncate">{note.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-3">{note.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
