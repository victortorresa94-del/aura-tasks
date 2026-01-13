
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Trash2, ShoppingBag, List, ChevronDown, FolderPlus, Grid, Tag, Wand2, Loader } from 'lucide-react';
import { ShoppingList as ShoppingListType, ShoppingItem } from '../../../types/nutrition';
import { nutritionService } from '../../../services/nutritionService';
import { useAuth } from '../../../contexts/AuthContext';

const PREDEFINED_CATEGORIES = ['Frutas', 'Verduras', 'Carne', 'Pescado', 'Lácteos', 'Despensa', 'Congelados', 'Limpieza', 'Higiene', 'Bebidas', 'Snacks', 'Otros', 'General'];

const SIMPLE_AI_MAP: Record<string, string> = {
    'pollo': 'Carne', 'ternera': 'Carne', 'cerdo': 'Carne', 'hamburguesa': 'Carne', 'jamon': 'Carne',
    'manzana': 'Frutas', 'platano': 'Frutas', 'naranja': 'Frutas', 'uva': 'Frutas', 'limon': 'Frutas',
    'lechuga': 'Verduras', 'tomate': 'Verduras', 'cebolla': 'Verduras', 'patata': 'Verduras', 'zanahoria': 'Verduras',
    'leche': 'Lácteos', 'yogur': 'Lácteos', 'queso': 'Lácteos', 'mantequilla': 'Lácteos',
    'arroz': 'Despensa', 'pasta': 'Despensa', 'pan': 'Despensa', 'aceite': 'Despensa', 'huevos': 'Despensa',
    'agua': 'Bebidas', 'cerveza': 'Bebidas', 'vino': 'Bebidas', 'cafe': 'Despensa',
    'shampoo': 'Higiene', 'gel': 'Higiene', 'papel': 'Limpieza', 'lejia': 'Limpieza'
};

export const ShoppingList: React.FC = () => {
    const { user } = useAuth();
    const [lists, setLists] = useState<ShoppingListType[]>([]);
    const [activeListId, setActiveListId] = useState<string | null>(null);
    const [newItemName, setNewItemName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('General');
    const [isCreatingList, setIsCreatingList] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [showListSelector, setShowListSelector] = useState(false);
    const [loadingCreate, setLoadingCreate] = useState(false);

    // AutoComplete
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [existingProducts, setExistingProducts] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            loadLists();
            loadProducts();
        }
    }, [user]);

    const loadProducts = async () => {
        if (!user) return;
        const products = await nutritionService.getUserProducts(user.uid);
        setExistingProducts(products);
    };

    const loadLists = async () => {
        if (!user) return;
        const userLists = await nutritionService.getShoppingLists(user.uid);
        if (userLists.length > 0) {
            setLists(userLists);
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

        setLoadingCreate(true);
        try {
            const newList = await nutritionService.createOrUpdateShoppingList(user.uid, [], undefined, newListName);
            setLists([...lists, newList]);
            setActiveListId(newList.id);
            setNewListName('');
            setIsCreatingList(false);
        } catch (error) {
            console.error("Error creating list:", error);
        } finally {
            setLoadingCreate(false);
        }
    };

    const toggleItem = async (itemId: string, checked: boolean) => {
        if (!user || !activeList) return;
        const updatedItems = activeList.items.map(item =>
            item.id === itemId ? { ...item, checked } : item
        );
        const updatedList = { ...activeList, items: updatedItems };
        updateLocalList(updatedList);
        await nutritionService.createOrUpdateShoppingList(user.uid, updatedItems, activeList.id, activeList.name);
    };

    const getSuggestedCategory = (name: string) => {
        const lower = name.toLowerCase();
        for (const [key, cat] of Object.entries(SIMPLE_AI_MAP)) {
            if (lower.includes(key)) return cat;
        }
        return 'General';
    };

    const handleItemInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNewItemName(val);

        // AI Suggest Category
        if (val.length > 2) {
            const suggested = getSuggestedCategory(val);
            if (suggested !== 'General') setSelectedCategory(suggested);

            // Product Autocomplete
            const matches = existingProducts.filter(p => p.name.toLowerCase().includes(val.toLowerCase())).slice(0, 3);
            setSuggestions(matches);
            setShowSuggestions(matches.length > 0);
        } else {
            setShowSuggestions(false);
        }
    };

    const selectSuggestion = (product: any) => {
        setNewItemName(product.name);
        setSelectedCategory(product.category || 'General');
        setShowSuggestions(false);
    };

    const addItem = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user || !newItemName.trim()) return;

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
            category: selectedCategory,
            checked: false,
            source: 'manual'
        };

        const updatedItems = [...currentItems, newItem];

        if (activeList) {
            updateLocalList({ ...activeList, items: updatedItems });
        }
        setNewItemName('');
        setShowSuggestions(false);
        setSelectedCategory('General'); // Reset

        // Server update
        try {
            const savedList = await nutritionService.createOrUpdateShoppingList(user.uid, updatedItems, targetListId!, targetListName);
            if (targetListId === savedList.id) updateLocalList(savedList);
        } catch (error) {
            console.error("Failed to save shopping list item:", error);
            // Optionally revert local state here if strict consistency is needed
        }
    };

    const deleteItem = async (itemId: string) => {
        if (!user || !activeList) return;
        const updatedItems = activeList.items.filter(i => i.id !== itemId);
        updateLocalList({ ...activeList, items: updatedItems });
        await nutritionService.createOrUpdateShoppingList(user.uid, updatedItems, activeList.id, activeList.name);
    };

    const updateItemCategory = async (itemId: string, newCategory: string) => {
        if (!user || !activeList) return;
        const updatedItems = activeList.items.map(i => i.id === itemId ? { ...i, category: newCategory } : i);
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
                <div className="relative z-20">
                    <button
                        onClick={() => setShowListSelector(!showListSelector)}
                        className="flex items-center gap-2 font-bold text-lg text-white hover:text-aura-accent transition-colors"
                    >
                        {activeList ? activeList.name : 'Seleccionar Lista'} <ChevronDown size={16} />
                    </button>

                    {showListSelector && (
                        <div className="fixed inset-0 z-[60] flex justify-center items-end sm:items-center sm:p-4">
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowListSelector(false)} />
                            <div className="relative w-full bg-[#1A1A1A] rounded-t-2xl sm:rounded-2xl p-6 sm:max-w-sm border-t sm:border border-white/10 shadow-xl animate-slide-up pb-safe flex flex-col max-h-[80vh]">
                                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 sm:hidden shrink-0" />
                                <h3 className="text-lg font-bold text-white mb-4 shrink-0">Mis Listas</h3>

                                <div className="overflow-y-auto custom-scrollbar flex-1 space-y-1 -mx-2 px-2">
                                    {lists.map(list => (
                                        <button
                                            key={list.id}
                                            onClick={() => { setActiveListId(list.id); setShowListSelector(false); }}
                                            className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl hover:bg-white/5 flex justify-between items-center transition-colors ${activeListId === list.id ? 'text-aura-accent bg-white/5 border border-aura-accent/20' : 'text-gray-400 border border-transparent'}`}
                                        >
                                            {list.name}
                                            {activeListId === list.id && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>

                                <div className="border-t border-white/10 pt-4 mt-4 shrink-0">
                                    <button
                                        onClick={() => { setIsCreatingList(true); setShowListSelector(false); }}
                                        className="w-full flex items-center justify-center gap-2 text-sm font-bold bg-aura-accent text-black p-3 rounded-xl hover:opacity-90 transition-opacity"
                                    >
                                        <Plus size={16} /> Nueva Lista
                                    </button>
                                </div>
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
                <div className="fixed inset-0 z-[60] flex justify-center items-end sm:items-center sm:p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => !loadingCreate && setIsCreatingList(false)} />
                    <div className="relative w-full bg-[#1A1A1A] rounded-t-2xl sm:rounded-2xl p-6 sm:max-w-sm border-t sm:border border-white/10 shadow-xl animate-slide-up pb-safe">
                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 sm:hidden" />
                        <h3 className="text-lg font-bold text-white mb-4">Nueva Lista de Compra</h3>
                        <form onSubmit={createNewList} className="space-y-4">
                            <input
                                type="text"
                                value={newListName}
                                onChange={e => setNewListName(e.target.value)}
                                placeholder="Nombre (ej: Mercadona)"
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-aura-accent text-lg"
                                autoFocus
                                disabled={loadingCreate}
                            />
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsCreatingList(false)} disabled={loadingCreate} className="flex-1 py-3 text-gray-400 font-bold hover:bg-white/5 rounded-xl disabled:opacity-50">Cancelar</button>
                                <button type="submit" disabled={!newListName.trim() || loadingCreate} className="flex-1 py-3 bg-aura-accent text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-50 shadow-lg shadow-aura-accent/20 flex items-center justify-center gap-2">
                                    {loadingCreate ? <Loader size={18} className="animate-spin" /> : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Active List Content */}
            {activeList ? (
                <>
                    {/* Add Item Form with Cat & Autocomplete */}
                    <div className="bg-aura-gray/20 p-5 rounded-3xl border border-white/10 relative z-10 shadow-sm">
                        {/* Progress Bar */}
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

                        <form onSubmit={addItem} className="flex gap-2 relative">
                            {/* Custom Category Dropdown */}
                            <div className="relative group min-w-[120px]">
                                <div className="h-full">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="appearance-none w-full h-full bg-black/40 border border-white/10 hover:border-aura-accent/50 rounded-xl pl-3 pr-8 text-xs font-bold uppercase tracking-wider text-aura-accent outline-none cursor-pointer transition-colors focus:border-aura-accent disabled:opacity-50"
                                    >
                                        {PREDEFINED_CATEGORIES.map(c => (
                                            <option key={c} value={c} className="bg-[#1A1A1A] text-white py-2">{c}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                </div>
                            </div>

                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={newItemName}
                                    onChange={handleItemInput}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white outline-none focus:border-aura-accent transition-colors"
                                    placeholder="Añadir producto..."
                                />
                                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-aura-accent text-black rounded-lg hover:bg-white transition-colors">
                                    <Plus size={16} />
                                </button>

                                {/* Autocomplete Suggestions */}
                                {showSuggestions && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-30 max-h-48 overflow-y-auto custom-scrollbar">
                                        {suggestions.map((p, idx) => (
                                            <button
                                                key={`${p.id}-${idx}`}
                                                type="button"
                                                onClick={() => selectSuggestion(p)}
                                                className="w-full text-left px-4 py-3 hover:bg-white/5 flex justify-between items-center group border-b border-white/5 last:border-0"
                                            >
                                                <span className="text-white font-medium">{p.name}</span>
                                                <span className="text-xs text-gray-500 group-hover:text-aura-accent bg-white/5 px-2 py-1 rounded-md">{p.category}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
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
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 pl-2 flex items-center gap-2">
                                        <Tag size={12} /> {category}
                                    </h3>
                                    <div className="space-y-2">
                                        {items.map(item => (
                                            <div key={item.id} className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${item.checked ? 'bg-black/20 border-transparent opacity-50' : 'bg-aura-gray/30 border-white/5 hover:border-white/10'}`}>
                                                <button
                                                    onClick={() => toggleItem(item.id, !item.checked)}
                                                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all shrink-0 ${item.checked ? 'bg-aura-accent border-aura-accent text-black' : 'border-gray-500 hover:border-white hover:border-aura-accent'}`}
                                                >
                                                    {item.checked && <Check size={14} />}
                                                </button>

                                                <div className="flex-1 min-w-0">
                                                    <span className={`font-medium block truncate ${item.checked ? 'line-through text-gray-500' : 'text-white'}`}>
                                                        {item.name}
                                                    </span>
                                                </div>

                                                {/* Styled Mini Category Switcher */}
                                                <div className="relative group/cat shrink-0">
                                                    <div className="flex items-center gap-1 hover:bg-white/5 px-2 py-1 rounded-lg transition-colors cursor-pointer">
                                                        <select
                                                            value={item.category || 'General'}
                                                            onChange={(e) => updateItemCategory(item.id, e.target.value)}
                                                            className="appearance-none bg-transparent text-[10px] text-gray-500 font-bold uppercase outline-none cursor-pointer hover:text-aura-accent w-full pr-3 text-right"
                                                        >
                                                            {PREDEFINED_CATEGORIES.map(c => (
                                                                <option key={c} value={c} className="bg-[#1A1A1A] text-white">{c}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown size={10} className="text-gray-600 absolute right-2 pointer-events-none" />
                                                    </div>
                                                </div>

                                                <button onClick={() => deleteItem(item.id)} className="text-gray-600 hover:text-red-400 p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    <Trash2 size={16} />
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
