
import React, { useState, useEffect } from 'react';
import {
    X, CheckCircle, Calendar, ArrowRight, Clock, Award,
    ChevronRight, Smile, Zap, RefreshCcw, MoreHorizontal
} from 'lucide-react';
import { Task, Priority, TaskStatus } from '../types';
import { AURA_IMAGE } from '../utils/constants';

interface TodayPlanningSessionProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    userName: string;
    onUpdateTask: (task: Task) => void;
    statuses: TaskStatus[];
}

const TodayPlanningSession: React.FC<TodayPlanningSessionProps> = ({
    isOpen, onClose, tasks, userName, onUpdateTask, statuses
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [animating, setAnimating] = useState(false);
    const [direction, setDirection] = useState<'left' | 'right'>('right');
    const [completedCount, setCompletedCount] = useState(0);

    // Filter relevant tasks: Pending and for today (or overdue)
    const today = new Date().toISOString().split('T')[0];
    // Initial filtering done in parent but let's be safe. We want to process "Active" tasks.
    // Note: Parent passes filtered "Today" tasks usually.
    const activeTasks = tasks.filter(t => !t.status.includes('done') && !t.status.includes('completada')); // Simple check, refine with status ID if needed

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
            setCompletedCount(0);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const currentTask = activeTasks[currentIndex];
    // If no more tasks
    const isFinished = currentIndex >= activeTasks.length;

    const handleAction = async (action: 'complete' | 'tomorrow' | 'later' | 'date' | 'priority', payload?: any) => {
        if (!currentTask) return;

        setAnimating(true);
        setDirection('right');

        // Wait for animation
        setTimeout(() => {
            // Apply Logic
            const updates: Partial<Task> = {};

            if (action === 'complete') {
                const doneId = statuses.find(s => s.isCompleted)?.id || 'done';
                updates.status = doneId;
                setCompletedCount(p => p + 1);
            } else if (action === 'tomorrow') {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                updates.date = d.toISOString().split('T')[0];
            } else if (action === 'later') {
                // Remove date or set to next week? User said "Más adelante".
                // Let's just remove date for backlog or set +7 days
                updates.date = '';
            } else if (action === 'priority') {
                updates.priority = payload;
            } else if (action === 'date') {
                updates.date = payload;
            }

            onUpdateTask({ ...currentTask, ...updates });

            // Next
            setAnimating(false);
            setCurrentIndex(prev => prev + 1);
        }, 300);
    };

    if (isFinished && activeTasks.length > 0) {
        return (
            <div className="fixed inset-0 z-[80] bg-aura-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in-up">
                <div className="text-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto border-4 border-emerald-500/30">
                        <CheckCircle size={48} className="text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">¡Planificación Completada!</h2>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Has organizado tus tareas de hoy. Te has quitado {completedCount} de encima y programado el resto.
                    </p>
                    <button onClick={onClose} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform">
                        Ir a mi día
                    </button>
                </div>
            </div>
        )
    }

    if (!currentTask && activeTasks.length === 0) {
        return (
            <div className="fixed inset-0 z-[80] bg-aura-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6">
                <div className="text-center">
                    <Smile size={64} className="text-aura-accent mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Todo limpio</h2>
                    <p className="text-gray-400 mb-6">No tienes tareas pendientes para hoy.</p>
                    <button onClick={onClose} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white">Volver</button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[80] bg-aura-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in">
            <button onClick={onClose} className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors">
                <X size={32} />
            </button>

            {/* Header Aura Avatar */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-80">
                <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 mb-2 shadow-lg shadow-indigo-500/20">
                    <img src={AURA_IMAGE} className="w-full h-full rounded-full object-cover border-2 border-black" alt="Aura" />
                </div>
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Planificador Diario</span>
            </div>

            {/* Main Card */}
            {currentTask && (
                <div className={`w-full max-w-2xl transform transition-all duration-300 ${animating ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>

                    <div className="bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                        {/* Progress */}
                        <div className="absolute top-0 left-0 h-1 bg-white/10 w-full">
                            <div className="h-full bg-aura-accent transition-all duration-300" style={{ width: `${(currentIndex / activeTasks.length) * 100}%` }}></div>
                        </div>

                        <div className="relative z-10 text-center mb-8 mt-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">
                                {currentTask.listId ? 'Proyecto' : 'Personal'}
                            </div>
                            <h2 className="text-2xl sm:text-4xl font-bold text-white leading-tight mb-4">{currentTask.title}</h2>

                            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                                <button className={`flex items-center gap-1 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5 ${currentTask.priority === 'alta' ? 'text-red-400' : currentTask.priority === 'media' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    <Award size={14} /> <span className="uppercase">{currentTask.priority}</span>
                                </button>
                                {currentTask.date && (
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} /> <span>{new Date(currentTask.date).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <button
                                onClick={() => handleAction('complete')}
                                className="col-span-2 sm:col-span-1 min-h-[100px] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl flex flex-col items-center justify-center gap-2 text-emerald-400 transition-all group/btn"
                            >
                                <CheckCircle className="w-8 h-8 group-hover/btn:scale-110 transition-transform" />
                                <span className="font-bold text-sm">Completada</span>
                            </button>

                            <button
                                onClick={() => handleAction('tomorrow')}
                                className="min-h-[100px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl flex flex-col items-center justify-center gap-2 text-white transition-all group/btn"
                            >
                                <div className="w-8 h-8 rounded-full bg-orange-400/20 flex items-center justify-center text-orange-400">
                                    <ArrowRight size={18} />
                                </div>
                                <span className="font-bold text-xs text-gray-300 group-hover/btn:text-white">Mañana</span>
                            </button>

                            <button
                                onClick={() => {
                                    // Logic for "This Week" (Next few days)
                                    const d = new Date();
                                    d.setDate(d.getDate() + 2); // Generic +2 days for example
                                    handleAction('date', d.toISOString().split('T')[0]);
                                }}
                                className="min-h-[100px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl flex flex-col items-center justify-center gap-2 text-white transition-all group/btn"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center text-blue-400">
                                    <Calendar size={18} />
                                </div>
                                <span className="font-bold text-xs text-gray-300 group-hover/btn:text-white">Esta semana</span>
                            </button>

                            <div className="min-h-[100px] flex flex-col gap-2">
                                <button
                                    onClick={() => handleAction('later')}
                                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <Clock size={14} /> <span className="text-xs font-bold">Más tarde</span>
                                </button>
                                <button
                                    onClick={() => {
                                        // Keep formatting: animate to next
                                        setAnimating(true);
                                        setTimeout(() => {
                                            setAnimating(false);
                                            setCurrentIndex(prev => prev + 1);
                                        }, 300);
                                    }}
                                    className="flex-1 bg-aura-accent/10 hover:bg-aura-accent/20 border border-aura-accent/20 rounded-xl flex items-center justify-center gap-2 text-aura-accent transiton-colors"
                                >
                                    <Zap size={14} /> <span className="text-xs font-bold">Mantener Hoy</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center mt-6">
                        <span className="text-xs text-white/20 font-mono">Tarea {currentIndex + 1} de {activeTasks.length}</span>
                    </div>

                </div>
            )}
        </div>
    );
};

export default TodayPlanningSession;
