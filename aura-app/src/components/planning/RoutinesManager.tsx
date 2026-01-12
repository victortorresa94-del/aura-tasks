import React, { useState, useEffect } from 'react';
import { Plus, Play, MoreVertical, Clock, ChevronUp, ChevronDown, Trash2, Edit3, X, ArrowLeft } from 'lucide-react';
import { Routine, RoutineStep } from '../../types/habits';
import { habitService } from '../../services/habitService';
import { useAuth } from '../../contexts/AuthContext';
import { RoutinePlayer } from './RoutinePlayer';

export const RoutinesManager: React.FC = () => {
    const { user } = useAuth();
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);

    // Create/Edit State
    const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
    const [name, setName] = useState('');
    const [context, setContext] = useState('mañana');
    const [steps, setSteps] = useState<RoutineStep[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) loadRoutines();
    }, [user]);

    const loadRoutines = async () => {
        if (!user) return;
        const data = await habitService.getUserRoutines(user.uid);
        setRoutines(data);
    };

    const calculateDuration = (currentSteps: RoutineStep[]) => {
        return currentSteps.reduce((acc, step) => acc + (step.durationMinutes || 0), 0);
    };

    const [emoji, setEmoji] = useState('🔄');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const routineData = {
                name,
                context: context as any,
                steps,
                estimatedDurationMinutes: calculateDuration(steps),
                emoji
            };

            if (editingRoutine) {
                await habitService.updateRoutine(editingRoutine.id, routineData);
            } else {
                await habitService.createRoutine(user.uid, routineData);
            }

            setIsModalOpen(false);
            resetForm();
            loadRoutines();
        } catch (error) {
            console.error("Error saving routine:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setEditingRoutine(null);
        setName('');
        setContext('mañana');
        setEmoji('🔄');
        setSteps([]);
        setIsSubmitting(false);
    };

    const openEdit = (routine: Routine) => {
        setEditingRoutine(routine);
        setName(routine.name);
        setContext(routine.context);
        setEmoji(routine.emoji || '🔄');
        setSteps([...routine.steps]);
        setIsModalOpen(true);
    };

    const handleEmojiClick = () => {
        const emojis = ['🔄', '☀️', '🌙', '🏃', '🚿', '📖', '🍵', '🎧'];
        const currentIdx = emojis.indexOf(emoji);
        setEmoji(emojis[(currentIdx + 1) % emojis.length]);
    };

    // ... (rest of helper functions addStep, etc. remain the same) 
    const addStep = () => {
        const newStep: RoutineStep = {
            id: Date.now().toString(),
            name: '',
            type: 'action',
            durationMinutes: 5
        };
        setSteps([...steps, newStep]);
    };

    const updateStep = (id: string, field: keyof RoutineStep, value: any) => {
        setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const removeStep = (id: string) => {
        setSteps(steps.filter(s => s.id !== id));
    };

    const moveStep = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === steps.length - 1) return;

        const newSteps = [...steps];
        const temp = newSteps[index];
        newSteps[index] = newSteps[index + (direction === 'up' ? -1 : 1)];
        newSteps[index + (direction === 'up' ? -1 : 1)] = temp;
        setSteps(newSteps);
    };


    // Switcher between List and Player
    if (activeRoutine) {
        return (
            <div className="h-full">
                <button
                    onClick={() => setActiveRoutine(null)}
                    className="mb-4 text-gray-400 hover:text-white flex items-center gap-2"
                >
                    <ArrowLeft size={20} /> Volver a rutinas
                </button>
                <RoutinePlayer routine={activeRoutine} onFinish={() => setActiveRoutine(null)} />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Rutinas en Bloque</h2>
                    <p className="text-gray-400 text-sm">Secuencias para simplificar tu día</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-aura-accent text-aura-black px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity w-full md:w-auto"
                >
                    <Plus size={18} /> Nueva Rutina
                </button>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {routines.map(routine => (
                    <div key={routine.id} className="bg-aura-gray/30 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between h-[180px] group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl pointer-events-none">
                            {routine.emoji}
                        </div>
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{routine.context}</span>
                                <div className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => openEdit(routine)} className="p-1 hover:text-white text-gray-400"><Edit3 size={16} /></button>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                <span>{routine.emoji}</span>
                                {routine.name}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Clock size={14} />
                                <span>{routine.estimatedDurationMinutes} min</span>
                                <span>•</span>
                                <span>{routine.steps.length} pasos</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setActiveRoutine(routine)}
                            className="w-full bg-white/5 hover:bg-aura-accent hover:text-aura-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-4"
                        >
                            <Play size={18} /> Iniciar Rutina
                        </button>
                    </div>
                ))}
            </div>

            {/* Editor Modal - Mobile Bottom Sheet Style */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)} />

                    <div className="relative w-full sm:max-w-2xl bg-[#1A1A1A] rounded-t-3xl sm:rounded-3xl p-6 md:p-8 border-t sm:border border-white/10 shadow-2xl max-h-[90vh] h-[90vh] sm:h-auto flex flex-col animate-slide-up ring-1 ring-white/10">
                        {/* Drag Handle Mobile */}
                        <div className="w-full flex justify-center mb-4 sm:hidden shrink-0">
                            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-6 flex-shrink-0">
                            {editingRoutine ? 'Editar Rutina' : 'Nueva Rutina'}
                        </h3>

                        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={handleEmojiClick}
                                        className="w-16 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-2xl hover:bg-white/5 transition-colors"
                                    >
                                        {emoji}
                                    </button>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Nombre</label>
                                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/30 border-b border-white/10 py-2 text-white outline-none focus:border-aura-accent" placeholder="Rutina de Mañana" required />
                                    </div>
                                </div>
                                <div className="w-full">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Contexto</label>
                                    <select value={context} onChange={e => setContext(e.target.value)} className="w-full bg-black/30 border-b border-white/10 py-2 text-white outline-none">
                                        <option value="mañana">Mañana</option>
                                        <option value="noche">Noche</option>
                                        <option value="trabajo">Trabajo</option>
                                        <option value="cuerpo">Cuerpo</option>
                                        <option value="mente">Mente</option>
                                    </select>
                                </div>


                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pasos ({steps.length})</label>
                                        <span className="text-xs text-aura-accent font-bold">Duración: {calculateDuration(steps)} min</span>
                                    </div>

                                    <div className="space-y-3">
                                        {steps.map((step, index) => (
                                            <div key={step.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                                <div className="flex flex-col gap-1">
                                                    <button type="button" onClick={() => moveStep(index, 'up')} disabled={index === 0} className="text-gray-600 hover:text-white disabled:opacity-30"><ChevronUp size={14} /></button>
                                                    <button type="button" onClick={() => moveStep(index, 'down')} disabled={index === steps.length - 1} className="text-gray-600 hover:text-white disabled:opacity-30"><ChevronDown size={14} /></button>
                                                </div>
                                                <div className="flex-1 grid grid-cols-3 gap-3">
                                                    <input
                                                        type="text"
                                                        value={step.name}
                                                        onChange={e => updateStep(step.id, 'name', e.target.value)}
                                                        className="col-span-2 bg-transparent border-b border-white/10 px-2 text-white text-sm outline-none focus:border-aura-accent"
                                                        placeholder="Nombre del paso"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={step.durationMinutes}
                                                            onChange={e => updateStep(step.id, 'durationMinutes', parseInt(e.target.value))}
                                                            className="w-12 bg-transparent border-b border-white/10 px-1 text-white text-sm text-right"
                                                        />
                                                        <span className="text-xs text-gray-500">min</span>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => removeStep(step.id)} className="text-gray-600 hover:text-red-400 px-2"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={addStep} className="w-full py-3 border border-dashed border-white/20 text-gray-400 rounded-xl hover:bg-white/5 hover:text-white transition-colors flex justify-center items-center gap-2">
                                            <Plus size={16} /> Añadir Paso
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 mt-4 border-t border-white/10 shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-400 font-bold hover:bg-white/5 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-aura-accent hover:bg-white text-black font-bold rounded-xl transition-colors disabled:opacity-50 flex justify-center gap-2 items-center">
                                    {isSubmitting && <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />}
                                    {isSubmitting ? 'Guardando...' : 'Guardar Rutina'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
