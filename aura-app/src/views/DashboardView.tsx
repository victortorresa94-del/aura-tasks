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
        <div className="h-full flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-8">
                <div className="flex items-center gap-3 mb-2">
                    <LayoutDashboard className="text-indigo-600" size={32} />
                    <h1 className="text-4xl font-bold text-gray-900">Inicio</h1>
                </div>
                <p className="text-gray-500">Bienvenido de nuevo. Aquí está tu resumen de hoy.</p>
            </div>

            {/* Stats Grid */}
            <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Today's Tasks */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <CheckSquare className="text-blue-500" size={24} />
                            <span className="text-3xl font-bold text-gray-900">{todaysTasks.length}</span>
                        </div>
                        <h3 className="font-semibold text-gray-700">Para Hoy</h3>
                        <p className="text-xs text-gray-400 mt-1">{pendingToday} pendientes</p>
                    </div>

                    {/* Completed */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckSquare className="text-white" size={14} />
                            </div>
                            <span className="text-3xl font-bold text-green-600">{completedToday}</span>
                        </div>
                        <h3 className="font-semibold text-gray-700">Completadas</h3>
                        <p className="text-xs text-gray-400 mt-1">Hoy</p>
                    </div>

                    {/* Total Tasks */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <TrendingUp className="text-purple-500" size={24} />
                            <span className="text-3xl font-bold text-gray-900">{tasks.length}</span>
                        </div>
                        <h3 className="font-semibold text-gray-700">Total Tareas</h3>
                        <p className="text-xs text-gray-400 mt-1">En el sistema</p>
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <StickyNote className="text-yellow-500" size={24} />
                            <span className="text-3xl font-bold text-gray-900">{notes.length}</span>
                        </div>
                        <h3 className="font-semibold text-gray-700">Notas</h3>
                        <p className="text-xs text-gray-400 mt-1">Documentadas</p>
                    </div>
                </div>
            </div>

            {/* Today's Tasks List */}
            <div className="px-6 pb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-indigo-600" />
                    Tareas para Hoy
                </h2>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {todaysTasks.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <p>No tienes tareas programadas para hoy.</p>
                            <p className="text-sm mt-2">¡Disfruta tu día libre! 🎉</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {todaysTasks.slice(0, 10).map(task => (
                                <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-300'} shrink-0`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'} truncate`}>
                                            {task.title}
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${task.priority === 'alta' ? 'bg-red-100 text-red-700' :
                                            task.priority === 'media' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-600'
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
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <StickyNote size={20} className="text-yellow-600" />
                        Notas Recientes
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notes.slice(0, 6).map(note => (
                            <div key={note.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-4 hover:shadow-md transition-shadow">
                                <h3 className="font-bold text-gray-800 mb-2 truncate">{note.title}</h3>
                                <p className="text-sm text-gray-600 line-clamp-3">{note.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
