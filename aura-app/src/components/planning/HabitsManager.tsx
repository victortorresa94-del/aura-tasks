import React, { useState, useEffect } from 'react';
import { Plus, Archive, MoreHorizontal, Check, Edit3, Trash2 } from 'lucide-react';
import { Habit } from '../../types/habits';
import { habitService } from '../../services/habitService';
import { useAuth } from '../../contexts/AuthContext';

export const HabitsManager: React.FC = () => {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [showArchived, setShowArchived] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [intention, setIntention] = useState('');
    const [rhythm, setRhythm] = useState('');
    const [context, setContext] = useState('mañana');

    useEffect(() => {
        if (user) loadHabits();
    }, [user]);

    const loadHabits = async () => {
        if (!user) return;
        const data = await habitService.getUserHabits(user.uid);
        setHabits(data);
    };

    const activeHabits = habits.filter(h => h.status === 'active');
    const archivedHabits = habits.filter(h => h.status === 'archived');
    const displayedHabits = showArchived ? archivedHabits : activeHabits;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            if (editingHabit) {
                await habitService.updateHabit(editingHabit.id, {
                    name, intention, rhythm, context: context as any
                });
            } else {
                await habitService.createHabit(user.uid, {
                    name, intention, rhythm, context: context as any
                });
            }
            setIsModalOpen(false);
            resetForm();
            loadHabits();
        } catch (error) {
            console.error("Error saving habit:", error);
        }
    };

    const handleArchive = async (habitId: string) => {
        await habitService.archiveHabit(habitId);
        loadHabits();
    };

    const handleEdit = (habit: Habit) => {
        setEditingHabit(habit);
        setName(habit.name);
        setIntention(habit.intention || '');
        setRhythm(habit.rhythm || '');
        setContext(habit.context);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingHabit(null);
        setName('');
        setIntention('');
        setRhythm('');
        setContext('mañana');
    };

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Hábitos</h2>
                    <p className="text-gray-400 text-sm">Intenciones que te acompañan</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`p-2 rounded-lg transition-colors ${showArchived ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Archive size={20} />
                    </button>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-aura-accent text-aura-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <Plus size={18} /> Nuevo
                    </button>
                </div>
            </div>

            {displayedHabits.length === 0 ? (
                <div className="bg-white/5 rounded-3xl p-10 text-center border border-dashed border-white/10">
                    <p className="text-gray-500">{showArchived ? 'No hay hábitos archivados' : 'No tienes hábitos activos aún'}</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {displayedHabits.map(habit => (
                        <div key={habit.id} className="bg-aura-gray/30 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{habit.context}</span>
                                        {habit.rhythm && <span className="text-xs text-gray-400">{habit.rhythm}</span>}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1">{habit.name}</h3>
                                    {habit.intention && (
                                        <p className="text-gray-400 text-sm italic">"{habit.intention}"</p>
                                    )}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(habit)} className="p-2 text-gray-400 hover:text-white bg-black/20 rounded-lg hover:bg-black/40">
                                        <Edit3 size={16} />
                                    </button>
                                    {habit.status === 'active' && (
                                        <button onClick={() => handleArchive(habit.id)} className="p-2 text-gray-400 hover:text-red-400 bg-black/20 rounded-lg hover:bg-black/40">
                                            <Archive size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Crear/Editar */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
                    <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-md p-8 border border-white/10 shadow-2xl">
                        <h3 className="text-2xl font-bold text-white mb-6">
                            {editingHabit ? 'Editar Hábito' : 'Nuevo Hábito'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Nombre</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-black/30 border-b-2 border-white/10 focus:border-aura-accent py-3 text-lg text-white outline-none transition-colors"
                                    placeholder="Ej: Leer antes de dormir"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Intención (Opcional)</label>
                                <textarea
                                    value={intention}
                                    onChange={e => setIntention(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-aura-accent min-h-[80px]"
                                    placeholder="Para calmar mi mente..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Ritmo</label>
                                    <input
                                        type="text"
                                        value={rhythm}
                                        onChange={e => setRhythm(e.target.value)}
                                        className="w-full bg-black/30 border-b border-white/10 py-2 text-white outline-none focus:border-aura-accent"
                                        placeholder="Ej: 3 veces por semana"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Contexto</label>
                                    <select
                                        value={context}
                                        onChange={e => setContext(e.target.value)}
                                        className="w-full bg-black/30 border-b border-white/10 py-2 text-white outline-none focus:border-aura-accent appearance-none"
                                    >
                                        <option value="mañana">Mañana</option>
                                        <option value="tarde">Tarde</option>
                                        <option value="noche">Noche</option>
                                        <option value="cuerpo">Cuerpo</option>
                                        <option value="mente">Mente</option>
                                        <option value="trabajo">Trabajo</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-400 font-bold hover:bg-white/5 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-aura-accent hover:bg-white text-black font-bold rounded-xl transition-colors shadow-lg shadow-aura-accent/20">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
