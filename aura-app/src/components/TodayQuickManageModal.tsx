
import React, { useState } from 'react';
import { X, CheckCircle, Calendar, ArrowRight, GripVertical } from 'lucide-react';
import { Task, Priority, TaskStatus } from '../types';

interface TodayQuickManageModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    onUpdateTask: (task: Task) => void;
    statuses: TaskStatus[];
}

const TodayQuickManageModal: React.FC<TodayQuickManageModalProps> = ({ isOpen, onClose, tasks, onUpdateTask, statuses }) => {
    if (!isOpen) return null;

    // Filter only today's tasks not done? Or all today's?
    // "Tareas programadas para hoy"
    const doneStatus = statuses.find(s => s.isCompleted)?.id;
    const activeTasks = tasks.filter(t => t.status !== doneStatus);
    const completedTasks = tasks.filter(t => t.status === doneStatus);

    const handleQuickStatus = (task: Task) => {
        if (doneStatus) {
            onUpdateTask({ ...task, status: doneStatus });
        }
    };

    const handlePostpone = (task: Task) => {
        // Move to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        onUpdateTask({ ...task, date: tomorrow.toISOString().split('T')[0] });
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-aura-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-scale-in">

                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#151515] rounded-t-2xl">
                    <h2 className="text-lg font-bold text-aura-white flex items-center gap-2">
                        ✨ Gestionar Hoy ({activeTasks.length})
                    </h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {activeTasks.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            <CheckCircle size={48} className="mx-auto mb-3 opacity-20" />
                            <p>¡Todo listo por hoy!</p>
                        </div>
                    )}

                    {activeTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl group border border-transparent hover:border-white/5 transition-all">
                            {/* Drag Handle (Simulated) */}
                            <GripVertical size={16} className="text-gray-600 cursor-grab active:cursor-grabbing" />

                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-gray-200 truncate">{task.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${task.priority === 'alta' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-500'}`}>{task.priority}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handlePostpone(task)}
                                    className="p-2 text-gray-500 hover:text-orange-400 hover:bg-orange-400/10 rounded-lg transition-colors"
                                    title="Posponer a mañana"
                                >
                                    <ArrowRight size={16} />
                                </button>
                                <button
                                    onClick={() => handleQuickStatus(task)}
                                    className="p-2 text-gray-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                                    title="Marcar completada"
                                >
                                    <CheckCircle size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {completedTasks.length > 0 && (
                        <>
                            <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mt-6 mb-2 px-2">Completadas hoy</div>
                            {completedTasks.map(task => (
                                <div key={task.id} className="flex items-center gap-3 p-3 opacity-50">
                                    <CheckCircle size={16} className="text-emerald-500" />
                                    <span className="text-sm text-gray-500 line-through truncate">{task.title}</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                <div className="p-3 border-t border-white/10 bg-[#151515] rounded-b-2xl">
                    <button onClick={onClose} className="w-full py-2.5 bg-aura-accent text-aura-black font-bold rounded-xl hover:opacity-90 transition-opacity text-sm">
                        Listo
                    </button>
                </div>

            </div>
        </div>
    );
};

export default TodayQuickManageModal;
