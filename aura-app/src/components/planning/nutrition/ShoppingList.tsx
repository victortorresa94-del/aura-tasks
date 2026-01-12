import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, ShoppingBag, List, ChevronDown, FolderPlus } from 'lucide-react';
import { ShoppingList as ShoppingListType, ShoppingItem } from '../../../types/nutrition';
import { nutritionService } from '../../../services/nutritionService';
import { useAuth } from '../../../contexts/AuthContext';

export const ShoppingList: React.FC = () => {
    const { user } = useAuth();
    const [lists, setLists] = useState<ShoppingListType[]>([]);
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [newItemName, setNewItemName] = useState('');
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [showListSelector, setShowListSelector] = useState(false);

    useEffect(() => {
        if (user) loadLists();
    }, [user]);

    const loadLists = async () => {
        if (!user) return;
        const userLists = await nutritionService.getShoppingLists(user.uid);

        // Ensure there is at least one list or handle empty state
        if (userLists.length > 0) {
            setLists(userLists);
            // If no active list selected (or invalid), select the first one
            if (!activeListId || !userLists.find(l => l.id === activeListId)) {
                setActiveListId(userLists[0].id);
            }
        } else {
            setLists([]);
            setActiveListId(null);
        }
    };

    const activeList = lists.find(l => l.id === activeListId) || null;

    const createNewList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newListName.trim()) return;

        try {
            const newList = await nutritionService.createOrUpdateShoppingList(user.uid, [], undefined, newListName);
            setLists([...lists, newList]);
            setActiveListId(newList.id);
            setNewListName('');
            setIsCreatingList(false);
        } catch (error) {
            console.error("Error creating list:", error);
        }
    };

    const toggleItem = async (itemId: string, checked: boolean) => {
        if (!user || !activeList) return;

        const updatedItems = activeList.items.map(item =>
            item.id === itemId ? { ...item, checked } : item
        );

        // Optimistic update
        const updatedList = { ...activeList, items: updatedItems };
        updateLocalList(updatedList);

        await nutritionService.createOrUpdateShoppingList(user.uid, updatedItems, activeList.id, activeList.name);
    };

    const addItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newItemName.trim()) return;

        // If no list exists, create one handled by default or forcing user?
        // Let's force creation if no list exists or create a default "General"
        let targetListId = activeListId;
        let targetListName = activeList?.name || 'Lista General';

        if (!targetListId) {
            const newList = await nutritionService.createOrUpdateShoppingList(user.uid, [], undefined, 'Lista General');
            setLists([newList]);
            targetListId = newList.id;
            setActiveListId(newList.id);
        }

        const currentItems = activeList?.items || [];
        const newItem: ShoppingItem = {
            id: Date.now().toString(),
            name: newItemName,
            quantity: '1',
            category: 'General',
            checked: false,
            source: 'manual'
        };

        const updatedItems = [...currentItems, newItem];

        // Optimistic
        if (activeList) {
            updateLocalList({ ...activeList, items: updatedItems });
        }
        setNewItemName('');

        // Server update
        // FIX: Pass listId to update existing list!
        const savedList = await nutritionService.createOrUpdateShoppingList(user.uid, updatedItems, targetListId!, targetListName);

        // Update state with server response to ensure sync
        if (targetListId === savedList.id) {
            updateLocalList(savedList);
        }
    };

    const deleteItem = async (itemId: string) => {
        if (!user || !activeList) return;
        const updatedItems = activeList.items.filter(i => i.id !== itemId);
        updateLocalList({ ...activeList, items: updatedItems });
        await nutritionService.createOrUpdateShoppingList(user.uid, updatedItems, activeList.id, activeList.name);
    };

    const clearCompleted = async () => {
        if (!user || !activeList) return;
        const updatedItems = activeList.items.filter(i => !i.checked);
        updateLocalList({ ...activeList, items: updatedItems });
        await nutritionService.createOrUpdateShoppingList(user.uid, updatedItems, activeList.id, activeList.name);
    };

    const updateLocalList = (updatedList: ShoppingListType) => {
        setLists(lists.map(l => l.id === updatedList.id ? updatedList : l));
    };

    // Grouping
    const groupedItems = activeList?.items.reduce((acc, item) => {
        const cat = item.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, ShoppingItem[]>) || {};

    const totalItems = activeList?.items.length || 0;
    const completedItems = activeList?.items.filter(i => i.checked).length || 0;
    const progress = totalItems === 0 ? 0 : (completedItems / totalItems) * 100;

    return (
        <div className="space-y-6 pb-24">
            {/* List Selector Header */}
            <div className="flex items-center justify-between bg-aura-gray/20 p-4 rounded-2xl border border-white/5">
                <div className="relative">
                    <button
                        onClick={() => setShowListSelector(!showListSelector)}
                        className="flex items-center gap-2 font-bold text-lg text-white hover:text-aura-accent transition-colors"
                    >
                        {activeList ? activeList.name : 'Seleccionar Lista'} <ChevronDown size={16} />
                    </button>

                    {showListSelector && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden animate-fade-in">
                            {lists.map(list => (
                                <button
                                    key={list.id}
                                    onClick={() => { setActiveListId(list.id); setShowListSelector(false); }}
                                    className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-white/5 flex justify-between items-center ${activeListId === list.id ? 'text-aura-accent bg-white/5' : 'text-gray-400'}`}
                                >
                                    {list.name}
                                    {activeListId === list.id && <Check size={14} />}
                                </button>
                            ))}
                            <div className="border-t border-white/10 p-2">
                                <button
                                    onClick={() => { setIsCreatingList(true); setShowListSelector(false); }}
                                    className="w-full flex items-center gap-2 text-xs font-bold text-aura-accent hover:bg-aura-accent/10 p-2 rounded-lg transition-colors"
                                >
                                    <Plus size={14} /> Nueva Lista
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                {activeList && (
                    <div className="text-xs text-gray-500 font-mono">
                        {completedItems}/{totalItems}
                    </div>
                )}
            </div>

            {/* Create List Modal */}
            {isCreatingList && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1A1A1A] rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-4">Nueva Lista de Compra</h3>
                        <form onSubmit={createNewList} className="space-y-4">
                            <input
                                type="text"
                                value={newListName}
                                onChange={e => setNewListName(e.target.value)}
                                placeholder="Nombre de la lista (ej: Supermercado)"
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-aura-accent"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsCreatingList(false)} className="flex-1 py-2 text-gray-400 font-bold hover:bg-white/5 rounded-lg">Cancelar</button>
                                <button type="submit" disabled={!newListName.trim()} className="flex-1 py-2 bg-aura-accent text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50">Crear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Active List Content */}
            {activeList ? (
                <>
                    {/* Progress & Quick Add */}
                    <div className="bg-aura-gray/20 p-5 rounded-3xl border border-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <div className="h-2 flex-1 bg-black/50 rounded-full overflow-hidden mr-4">
                                <div className="h-full bg-aura-accent transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                            </div>
                            {completedItems > 0 && (
                                <button onClick={clearCompleted} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Trash2 size={12} /> Limpiar
                                </button>
                            )}
                        </div>

                        <form onSubmit={addItem} className="relative">
                            <input
                                type="text"
                                value={newItemName}
                                onChange={e => setNewItemName(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white outline-none focus:border-aura-accent transition-colors"
                                placeholder="Añadir producto..."
                            />
                            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-aura-accent text-black rounded-lg hover:bg-white transition-colors">
                                <Plus size={16} />
                            </button>
                        </form>
                    </div>

                    {/* Items List */}
                    {totalItems === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Lista vacía</p>
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
                                                <button onClick={() => deleteItem(item.id)} className="text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12 space-y-4">
                    <FolderPlus size={48} className="mx-auto text-gray-600" />
                    <p className="text-gray-400">No tienes listas de compra.</p>
                    <button
                        onClick={() => setIsCreatingList(true)}
                        className="bg-aura-accent text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
                    >
                        Crear mi primera lista
                    </button>
                </div>
            )}
        </div>
    );
};
