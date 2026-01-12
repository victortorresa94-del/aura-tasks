import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, RefreshCw, ShoppingCart, Trash2 } from 'lucide-react';
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

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [selectedMeal, setSelectedMeal] = useState<string | null>(null);

    // Selection State
    const [selectionType, setSelectionType] = useState<'recipe' | 'text'>('recipe');
    const [selectedRecipeId, setSelectedRecipeId] = useState('');
    const [manualText, setManualText] = useState('');

    useEffect(() => {
        if (user) {
            loadRecipes();
            loadPlan();
        }
    }, [user, currentDate]);

    const getWeekStartDate = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    const loadRecipes = async () => {
        if (!user) return;
        const data = await nutritionService.getUserRecipes(user.uid);
        setRecipes(data);
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
                days: DAY_KEYS.reduce((acc, Day) => ({
                    ...acc,
                    [Day]: { breakfast: [], lunch: [], dinner: [] }
                }), {} as any)
            });
        }
    };

    const savePlan = async () => {
        if (!user || !weekPlan) return;
        await nutritionService.saveWeekPlan(user.uid, {
            startDate: weekPlan.startDate,
            days: weekPlan.days,
            generatedShoppingListId: weekPlan.generatedShoppingListId
        });
        alert('Plan guardado correctamente');
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
    };

    const addToSlot = () => {
        if (!weekPlan || !selectedDay || !selectedMeal) return;

        const newItem = {
            type: selectionType,
            value: selectionType === 'recipe' ? selectedRecipeId : manualText,
            name: selectionType === 'recipe'
                ? recipes.find(r => r.id === selectedRecipeId)?.name || 'Receta'
                : manualText
        };

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

    if (!weekPlan) return <div>Cargando plan...</div>;

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
                    <button onClick={savePlan} className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/30 font-bold hover:bg-emerald-500/30">
                        Guardar
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

            {/* Modal Selection */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-sm p-6 border border-white/10 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-4 capitalize">Añadir a {selectedDay} - {selectedMeal === 'lunch' ? 'Comida' : selectedMeal === 'dinner' ? 'Cena' : 'Desayuno'}</h3>

                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setSelectionType('recipe')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${selectionType === 'recipe' ? 'bg-aura-accent text-black' : 'bg-white/5 text-gray-400'}`}
                            >
                                Receta
                            </button>
                            <button
                                onClick={() => setSelectionType('text')}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${selectionType === 'text' ? 'bg-aura-accent text-black' : 'bg-white/5 text-gray-400'}`}
                            >
                                Texto Libre
                            </button>
                        </div>

                        {selectionType === 'recipe' ? (
                            <div className="mb-4">
                                <select
                                    value={selectedRecipeId}
                                    onChange={e => setSelectedRecipeId(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none"
                                >
                                    <option value="">Selecciona una receta...</option>
                                    {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={manualText}
                                    onChange={e => setManualText(e.target.value)}
                                    placeholder="Ej: Sobras de ayer, Comer fuera..."
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none"
                                    autoFocus
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-gray-400 hover:text-white">Cancelar</button>
                            <button onClick={addToSlot} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold">Añadir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
