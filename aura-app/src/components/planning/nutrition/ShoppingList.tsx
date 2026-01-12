import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { ShoppingList as ShoppingListType, ShoppingItem } from '../../../types/nutrition';
import { nutritionService } from '../../../services/nutritionService';
import { useAuth } from '../../../contexts/AuthContext';

export const ShoppingList: React.FC = () => {
    const { user } = useAuth();
    const [list, setList] = useState<ShoppingListType | null>(null);
    const [newItemName, setNewItemName] = useState('');

    useEffect(() => {
        if (user) loadList();
    }, [user]);

    const loadList = async () => {
        if (!user) return;
        const activeList = await nutritionService.getActiveShoppingList(user.uid);
        setList(activeList);
    };

    const toggleItem = async (itemId: string, checked: boolean) => {
        if (!user || !list) return;

        // Optimistic Update
        const updatedItems = list.items.map(item =>
            item.id === itemId ? { ...item, checked } : item
        );
        setList({ ...list, items: updatedItems });

        await nutritionService.createOrUpdateShoppingList(user.uid, updatedItems);
    };

    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newItemName.trim()) return;

        // Use current items or empty array
        const currentItems = list?.items || [];

        const newItem: ShoppingItem = {
            id: Date.now().toString(),
            name: newItemName,
            quantity: '1',
            category: 'General',
            checked: false,
            source: 'manual'
        };

        const updatedItems = [...currentItems, newItem];

        // Optimistic Update can be tricky without ID if list doesn't exist
        // But render handles logic.

        setNewItemName('');

        // This returns the full list object including ID
        const savedList = await nutritionService.createOrUpdateShoppingList(user.uid, updatedItems);
        setList(savedList as any);
    };

    const deleteItem = async (itemId: string) => {
        if (!user || !list) return;
        const updatedItems = list.items.filter(i => i.id !== itemId);
        setList({ ...list, items: updatedItems });
        await nutritionService.createOrUpdateShoppingList(user.uid, updatedItems);
    };

    const clearCompleted = async () => {
        if (!user || !list) return;
        const updatedItems = list.items.filter(i => !i.checked);
        setList({ ...list, items: updatedItems });
        await nutritionService.createOrUpdateShoppingList(user.uid, updatedItems);
    };

    // Grouping
    const groupedItems = list?.items.reduce((acc, item) => {
        const cat = item.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, ShoppingItem[]>) || {};

    const totalItems = list?.items.length || 0;
    const completedItems = list?.items.filter(i => i.checked).length || 0;
    const progress = totalItems === 0 ? 0 : (completedItems / totalItems) * 100;

    return (
        <div className="space-y-6">
            {/* Header & Stats */}
            <div className="bg-aura-gray/20 p-6 rounded-3xl border border-white/5">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Lista de la Compra</h2>
                        <p className="text-gray-400 text-sm">{completedItems} de {totalItems} productos completados</p>
                    </div>
                    {completedItems > 0 && (
                        <button onClick={clearCompleted} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Trash2 size={12} /> Limpiar completados
                        </button>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                    <div className="h-full bg-aura-accent transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                </div>

                {/* Add Item Form */}
                <form onSubmit={addItem} className="mt-6 relative">
                    <input
                        type="text"
                        value={newItemName}
                        onChange={e => setNewItemName(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white outline-none focus:border-aura-accent transition-colors"
                        placeholder="Añadir producto rápido..."
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-aura-accent text-black rounded-lg hover:bg-white transition-colors">
                        <Plus size={16} />
                    </button>
                </form>
            </div>

            {/* List */}
            {!list || list.items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Tu lista está vacía.</p>
                    <p className="text-sm">Genera una desde el Plan Semanal o añade items manualmente.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedItems).map(([category, items]) => (
                        <div key={category} className="animate-fade-in-up">
                            <h3 className="text-xs font-bold text-aura-accent uppercase tracking-widest mb-3 pl-2">{category}</h3>
                            <div className="space-y-2">
                                {items.map(item => (
                                    <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${item.checked ? 'bg-black/20 border-transparent opacity-50' : 'bg-aura-gray/30 border-white/5 hover:border-white/10'}`}>
                                        <button
                                            onClick={() => toggleItem(item.id, !item.checked)}
                                            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${item.checked ? 'bg-aura-accent border-aura-accent text-black' : 'border-gray-500 hover:border-white'}`}
                                        >
                                            {item.checked && <Check size={14} />}
                                        </button>
                                        <span className={`flex-1 font-medium ${item.checked ? 'line-through text-gray-500' : 'text-white'}`}>
                                            {item.name}
                                        </span>
                                        {item.quantity && item.quantity !== '1' && (
                                            <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-md">{item.quantity}</span>
                                        )}
                                        <button onClick={() => deleteItem(item.id)} className="text-gray-600 hover:text-red-400 p-1 opacity-0 hover:opacity-100 transition-opacity">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
