import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, RefreshCw, ShoppingCart, Trash2, ChevronDown } from 'lucide-react';
import { WeekPlan, Recipe, DailyPlan, MealType } from '../../../types/nutrition';
import { nutritionService } from '../../../services/nutritionService';
import { useAuth } from '../../../contexts/AuthContext';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const WeeklyPlan: React.FC = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
    const [recipes, setRecipes] = useState<Recipe[]>([]);

    // Saving state
    const [isSaving, setIsSaving] = useState(false);

    // Recents State
    const [recents, setRecents] = useState<any[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [selectedMeal, setSelectedMeal] = useState<string | null>(null);

    // Selection State
    const [selectionType, setSelectionType] = useState<'recipe' | 'text' | 'recent'>('recipe');
    const [selectedRecipeId, setSelectedRecipeId] = useState('');
    const [manualText, setManualText] = useState('');

    useEffect(() => {
        if (user) {
            loadRecipes();
            loadPlan();
            loadRecents();
        }
    }, [user, currentDate]);

    const getWeekStartDate = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(d.setDate(diff));

        // Use local date string to avoid UTC shifts format YYYY-MM-DD
        const year = monday.getFullYear();
        const month = String(monday.getMonth() + 1).padStart(2, '0');
        const dayStr = String(monday.getDate()).padStart(2, '0');
        return `${year}-${month}-${dayStr}`;
    };

    const loadRecipes = async () => {
        if (!user) return;
        const data = await nutritionService.getUserRecipes(user.uid);
        setRecipes(data);
    };

    const loadRecents = async () => {
        if (!user) return;
        const data = await nutritionService.getRecentMealItems(user.uid);
        setRecents(data);
    };

    const loadPlan = async () => {
        if (!user) return;
        const dateStr = getWeekStartDate(currentDate);
        const plan = await nutritionService.getWeekPlan(user.uid, dateStr);

        if (plan) {
            setWeekPlan(plan);
        } else {
            // Initialize empty plan
            setWeekPlan({
                id: '',
                userId: user.uid,
                startDate: dateStr,
                // Ensure days structure is full
                days: DAY_KEYS.reduce((acc, Day) => ({
                    ...acc,
                    [Day]: { breakfast: [], lunch: [], dinner: [] }
                }), {} as any)
            });
        }
    };

    const savePlan = async () => {
        if (!user || !weekPlan) return;
        setIsSaving(true);
        try {
            // Save and update local ID to prevent duplicates if creating new
            const savedPlan = await nutritionService.saveWeekPlan(user.uid, {
                startDate: weekPlan.startDate,
                days: weekPlan.days,
                generatedShoppingListId: weekPlan.generatedShoppingListId
            });

            // Update local state with the returned ID (important!)
            setWeekPlan(prev => prev ? ({ ...prev, id: savedPlan.id }) : savedPlan);

            // Optional: Toast or subtle feedback instead of alert
            // alert('Plan guardado correctamente'); 
        } catch (error) {
            console.error("Error saving plan:", error);
            alert("Error al guardar el plan. Inténtalo de nuevo.");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const openModal = (day: string, meal: string) => {
        setSelectedDay(day);
        setSelectedMeal(meal);
        setSelectionType('recipe');
        setSelectedRecipeId('');
        setManualText('');
        setIsModalOpen(true);
        loadRecents();
    };

    const addToSlot = () => {
        if (!weekPlan || !selectedDay || !selectedMeal) return;

        let newItem;

        if (selectionType === 'recipe') {
            newItem = {
                type: 'recipe',
                value: selectedRecipeId,
                name: recipes.find(r => r.id === selectedRecipeId)?.name || 'Receta'
            };
        } else if (selectionType === 'text') {
            newItem = {
                type: 'text',
                value: manualText,
                name: manualText
            };
        } else {
            // Should not happen via 'Add' button if hidden, but just in case
            return;
        }

        if (!newItem.value) return;

        const currentDayPlan = weekPlan.days[selectedDay as keyof typeof weekPlan.days] as DailyPlan;
        const currentMealList = currentDayPlan[selectedMeal] || [];

        const newDays = {
            ...weekPlan.days,
            [selectedDay]: {
                ...currentDayPlan,
                [selectedMeal]: [...currentMealList, newItem]
            }
        };

        setWeekPlan({ ...weekPlan, days: newDays });
        setIsModalOpen(false);
    };

    const clearSlot = (day: string, meal: string, index: number) => {
        if (!weekPlan) return;
        const currentDayPlan = weekPlan.days[day as keyof typeof weekPlan.days] as DailyPlan;
        const currentMealList = [...currentDayPlan[meal]];
        currentMealList.splice(index, 1);

        const newDays = {
            ...weekPlan.days,
            [day]: {
                ...currentDayPlan,
                [meal]: currentMealList
            }
        };
        setWeekPlan({ ...weekPlan, days: newDays });
    };

    if (!weekPlan) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando tu plan...</div>;

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex justify-between items-center bg-aura-gray/20 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                    <button onClick={handlePrevWeek} className="p-2 hover:bg-white/10 rounded-lg text-white"><ChevronLeft /></button>
                    <div className="text-center">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Semana del</p>
                        <p className="text-white font-bold">{weekPlan.startDate}</p>
                    </div>
                    <button onClick={handleNextWeek} className="p-2 hover:bg-white/10 rounded-lg text-white"><ChevronRight /></button>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={savePlan}
                        disabled={isSaving}
                        className={`px-6 py-2 rounded-xl font-bold border transition-all flex items-center gap-2 ${isSaving ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 cursor-wait' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'}`}
                    >
                        {isSaving ? (
                            <>
                                <RefreshCw size={18} className="animate-spin" /> Guardando...
                            </>
                        ) : (
                            'Guardar Plan'
                        )}
                    </button>
                    <button className="bg-aura-accent text-aura-black px-4 py-2 rounded-xl font-bold hover:bg-white transition-colors flex items-center gap-2">
                        <ShoppingCart size={18} /> Generar Lista
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="overflow-x-auto pb-4">
                <div className="min-w-[1000px] grid grid-cols-8 gap-2">
                    {/* Labels Header */}
                    <div className="sticky left-0 bg-[#0f1c23] z-10 p-2"></div>
                    {DAY_LABELS.map(label => (
                        <div key={label} className="text-center font-bold text-gray-500 text-sm uppercase tracking-wider py-2">
                            {label}
                        </div>
                    ))}

                    {/* Breakfast Row */}
                    <div className="sticky left-0 bg-[#0f1c23] z-10 flex items-center justify-center font-bold text-aura-accent text-xs uppercase tracking-widest border-r border-white/5 pr-4 h-32">
                        Desayuno
                    </div>
                    {DAY_KEYS.map(day => (
                        <div key={`breakfast-${day}`} className="bg-white/5 rounded-xl border border-white/5 p-2 min-h-[120px] flex flex-col gap-2 relative group hover:border-white/20 transition-colors">
                            {(weekPlan.days[day as keyof typeof weekPlan.days] as any).breakfast.map((item: any, idx: number) => (
                                <div key={idx} className="bg-black/40 p-2 rounded-lg text-xs text-white relative group/item border border-white/5">
                                    {item.name}
                                    <button onClick={() => clearSlot(day, 'breakfast', idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/item:opacity-100"><Trash2 size={10} /></button>
                                </div>
                            ))}
                            <button onClick={() => openModal(day, 'breakfast')} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-all rounded-xl">
                                <Plus className="text-white" />
                            </button>
                        </div>
                    ))}

                    {/* Lunch Row */}
                    <div className="sticky left-0 bg-[#0f1c23] z-10 flex items-center justify-center font-bold text-aura-accent text-xs uppercase tracking-widest border-r border-white/5 pr-4 h-32">
                        Comida
                    </div>
                    {DAY_KEYS.map(day => (
                        <div key={`lunch-${day}`} className="bg-white/5 rounded-xl border border-white/5 p-2 min-h-[120px] flex flex-col gap-2 relative group hover:border-white/20 transition-colors">
                            {(weekPlan.days[day as keyof typeof weekPlan.days] as any).lunch.map((item: any, idx: number) => (
                                <div key={idx} className="bg-black/40 p-2 rounded-lg text-xs text-white relative group/item border border-white/5">
                                    {item.name}
                                    <button onClick={() => clearSlot(day, 'lunch', idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/item:opacity-100"><Trash2 size={10} /></button>
                                </div>
                            ))}
                            <button onClick={() => openModal(day, 'lunch')} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-all rounded-xl">
                                <Plus className="text-white" />
                            </button>
                        </div>
                    ))}

                    {/* Dinner Row */}
                    <div className="sticky left-0 bg-[#0f1c23] z-10 flex items-center justify-center font-bold text-aura-accent text-xs uppercase tracking-widest border-r border-white/5 pr-4 h-32">
                        Cena
                    </div>
                    {DAY_KEYS.map(day => (
                        <div key={`dinner-${day}`} className="bg-white/5 rounded-xl border border-white/5 p-2 min-h-[120px] flex flex-col gap-2 relative group hover:border-white/20 transition-colors">
                            {(weekPlan.days[day as keyof typeof weekPlan.days] as any).dinner.map((item: any, idx: number) => (
                                <div key={idx} className="bg-black/40 p-2 rounded-lg text-xs text-white relative group/item border border-white/5">
                                    {item.name}
                                    <button onClick={() => clearSlot(day, 'dinner', idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/item:opacity-100"><Trash2 size={10} /></button>
                                </div>
                            ))}
                            <button onClick={() => openModal(day, 'dinner')} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-all rounded-xl">
                                <Plus className="text-white" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal - Mobile Bottom Sheet Style */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)} />

                    <div className="relative w-full sm:max-w-md bg-[#1A1A1A] rounded-t-3xl sm:rounded-3xl p-6 md:p-8 border-t sm:border border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up ring-1 ring-white/10">
                        <div className="w-full flex justify-center mb-4 sm:hidden">
                            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-6 capitalize flex items-center justify-between">
                            <span>{selectedDay} - {selectedMeal === 'lunch' ? 'Comida' : selectedMeal === 'dinner' ? 'Cena' : 'Desayuno'}</span>
                        </h3>

                        <div className="flex gap-2 mb-6 bg-black/40 p-1 rounded-xl">
                            <button
                                onClick={() => setSelectionType('recipe')}
                                className={`flex-1 py-3 text-xs font-bold rounded-lg transition-colors ${selectionType === 'recipe' ? 'bg-aura-accent text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                                Recetas
                            </button>
                            <button
                                onClick={() => setSelectionType('recent')}
                                className={`flex-1 py-3 text-xs font-bold rounded-lg transition-colors ${selectionType === 'recent' ? 'bg-aura-accent text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                                Recientes
                            </button>
                            <button
                                onClick={() => setSelectionType('text')}
                                className={`flex-1 py-3 text-xs font-bold rounded-lg transition-colors ${selectionType === 'text' ? 'bg-aura-accent text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                                Texto
                            </button>
                        </div>

                        <div className="min-h-[200px]">
                            {selectionType === 'recipe' && (
                                <div className="mb-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Seleccionar Receta</label>
                                    <div className="relative">
                                        <select
                                            value={selectedRecipeId}
                                            onChange={e => setSelectedRecipeId(e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white outline-none appearance-none focus:border-aura-accent transition-colors"
                                        >
                                            <option value="">-- Elige una receta --</option>
                                            {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectionType === 'recent' && (
                                <div className="mb-4 max-h-[250px] overflow-y-auto space-y-2 custom-scrollbar">
                                    {recents.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl">
                                            <p>No hay ítems recientes</p>
                                        </div>
                                    ) : (
                                        recents.map((item, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    if (item.type === 'recipe') {
                                                        setSelectionType('recipe');
                                                        setSelectedRecipeId(item.value);
                                                    } else {
                                                        setSelectionType('text');
                                                        setManualText(item.name);
                                                    }
                                                }}
                                                className="w-full text-left bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/5 transition-colors flex items-center justify-between group"
                                            >
                                                <span className="font-medium text-white group-hover:text-aura-accent transition-colors">{item.name}</span>
                                                <span className="text-[10px] bg-black/40 px-2 py-1 rounded text-gray-400 uppercase">{item.type === 'recipe' ? 'Receta' : 'Manual'}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}

                            {selectionType === 'text' && (
                                <div className="mb-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Entrada Manual</label>
                                    <input
                                        type="text"
                                        value={manualText}
                                        onChange={e => setManualText(e.target.value)}
                                        placeholder="Ej: Sobras, Comer fuera..."
                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-aura-accent"
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-400 hover:text-white font-bold rounded-xl hover:bg-white/5 transition-colors">Cancelar</button>
                            {selectionType !== 'recent' && (
                                <button
                                    onClick={addToSlot}
                                    className="flex-1 py-3 bg-aura-accent text-black rounded-xl font-bold hover:bg-white transition-colors shadow-[0_0_15px_rgba(212,225,87,0.3)]"
                                >
                                    Añadir
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
