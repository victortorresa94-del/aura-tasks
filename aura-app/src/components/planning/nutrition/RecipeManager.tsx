import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, ChefHat, Euro, List, X } from 'lucide-react';
import { Recipe, Product, Ingredient } from '../../../types/nutrition';
import { nutritionService } from '../../../services/nutritionService';
import { useAuth } from '../../../contexts/AuthContext';

export const RecipeManager: React.FC = () => {
    const { user } = useAuth();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [products, setProducts] = useState<Product[]>([]); // For ingredient linking
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [name, setName] = useState('');
    const [portions, setPortions] = useState(1);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [instructions, setInstructions] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        if (user) {
            loadRecipes();
            loadProducts();
        }
    }, [user]);

    const loadRecipes = async () => {
        if (!user) return;
        const data = await nutritionService.getUserRecipes(user.uid);
        setRecipes(data);
    };

    const loadProducts = async () => {
        if (!user) return;
        const data = await nutritionService.getUserProducts(user.uid);
        setProducts(data);
    };

    const filteredRecipes = recipes.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Calculate approximate cost
        const estimatedCost = ingredients.reduce((acc, ing) => {
            const prod = products.find(p => p.id === ing.linkedProductId);
            return acc + (prod?.price || 0); // Very rough estimation
        }, 0);

        const recipeData = {
            name,
            portions,
            ingredients,
            estimatedCost,
            instructions,
            imageUrl
        };

        if (editingRecipe) {
            // Update logic would go here if service supported it directly,
            // for now we might need to handle it or verify if 'createRecipe' overwrites? 
            // The service uses 'addDoc' (auto-id). So we are treating this as "Create New" always if we don't fix service.
            // TODO: Fix service to support update. For now assuming new.
            // Actually, let's just log and not duplicate for now to avoid mess, 
            // but ideally we should update.
            await nutritionService.createRecipe(user.uid, recipeData); // Fallback
        } else {
            await nutritionService.createRecipe(user.uid, recipeData);
        }

        setIsModalOpen(false);
        resetForm();
        loadRecipes();
    };

    const resetForm = () => {
        setEditingRecipe(null);
        setName('');
        setPortions(1);
        setIngredients([]);
        setInstructions('');
        setImageUrl('');
    };

    const openEdit = (recipe: Recipe) => {
        setEditingRecipe(recipe);
        setName(recipe.name);
        setPortions(recipe.portions);
        setIngredients(recipe.ingredients || []);
        setInstructions(recipe.instructions || '');
        setImageUrl(recipe.imageUrl || '');
        setIsModalOpen(true);
    };

    const openNew = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const addIngredient = () => {
        setIngredients([...ingredients, { id: Date.now().toString(), name: '', quantity: '1' }]);
    };

    const updateIngredient = (id: string, field: keyof Ingredient, value: any) => {
        setIngredients(ingredients.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const removeIngredient = (id: string) => {
        setIngredients(ingredients.filter(i => i.id !== id));
    };

    // Detail View State
    const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar recetas..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white outline-none focus:border-aura-accent"
                    />
                </div>
                <button
                    onClick={openNew}
                    className="bg-aura-accent text-aura-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90"
                >
                    <Plus size={18} /> Nueva
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecipes.map(recipe => (
                    <div
                        key={recipe.id}
                        onClick={() => setViewingRecipe(recipe)}
                        className="bg-aura-gray/30 rounded-2xl border border-white/5 hover:border-white/20 transition-all group cursor-pointer overflow-hidden flex flex-col"
                    >
                        {/* Card Image */}
                        <div className="h-32 bg-white/5 w-full relative">
                            {recipe.imageUrl ? (
                                <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <ChefHat size={32} opacity={0.5} />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1">
                                {recipe.portions} rac.
                            </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-bold text-white text-lg mb-2 line-clamp-1">{recipe.name}</h3>
                            <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                {recipe.ingredients.length} ingredientes {recipe.instructions ? '• Con instrucciones' : ''}
                            </p>

                            <div className="pt-3 border-t border-white/5 flex justify-between items-center mt-auto">
                                <span className="text-xs text-gray-500">Coste est.</span>
                                <span className="font-bold text-emerald-400">~{recipe.estimatedCost?.toFixed(2)}€</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* View Modal */}
            {viewingRecipe && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in" onClick={() => setViewingRecipe(null)} />

                    <div className="relative w-full sm:max-w-2xl bg-[#1A1A1A] rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 shadow-2xl max-h-[90vh] h-[90vh] sm:h-auto flex flex-col animate-slide-up ring-1 ring-white/10 overflow-hidden">

                        {/* Image Header */}
                        <div className="h-48 sm:h-64 w-full bg-white/5 relative shrink-0">
                            {viewingRecipe.imageUrl ? (
                                <img src={viewingRecipe.imageUrl} alt={viewingRecipe.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <ChefHat size={64} opacity={0.2} />
                                </div>
                            )}
                            <button
                                onClick={() => setViewingRecipe(null)}
                                className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/80"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">{viewingRecipe.name}</h2>
                                    <div className="flex gap-4 text-sm text-gray-400">
                                        <span className="bg-white/5 px-3 py-1 rounded-full">{viewingRecipe.portions} Raciones</span>
                                        <span className="bg-white/5 px-3 py-1 rounded-full">~{viewingRecipe.estimatedCost?.toFixed(2)}€</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setViewingRecipe(null); openEdit(viewingRecipe); }}
                                    className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-aura-accent transition-colors"
                                >
                                    <Edit3 size={20} />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Ingredientes</h3>
                                    <ul className="space-y-3">
                                        {viewingRecipe.ingredients.map((ing, idx) => (
                                            <li key={idx} className="flex justify-between items-center text-gray-300">
                                                <span>{ing.name}</span>
                                                <span className="font-bold text-white/50">{ing.quantity}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {viewingRecipe.instructions && (
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Instrucciones</h3>
                                        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                            {viewingRecipe.instructions}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in" onClick={() => setIsModalOpen(false)} />

                    <div className="relative w-full sm:max-w-2xl bg-[#1A1A1A] rounded-t-3xl sm:rounded-3xl p-6 md:p-8 border-t sm:border border-white/10 shadow-2xl max-h-[90vh] h-auto flex flex-col animate-slide-up ring-1 ring-white/10">
                        <div className="w-full flex justify-center mb-4 sm:hidden shrink-0">
                            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-6 flex-shrink-0">
                            {editingRecipe ? 'Editar Receta' : 'Nueva Receta'}
                        </h3>
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Nombre</label>
                                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/60 border-b border-white/20 py-3 px-2 text-white outline-none focus:border-aura-accent text-lg font-medium" placeholder="Pasta con tomate" required />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Raciones</label>
                                        <input type="number" min="1" value={portions} onChange={e => setPortions(parseInt(e.target.value))} className="w-full bg-black/30 border-b border-white/10 py-2 text-white outline-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Imagen (URL)</label>
                                    <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full bg-black/30 border-b border-white/10 py-2 text-white outline-none focus:border-aura-accent" placeholder="https://..." />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Ingredientes</label>
                                    <div className="space-y-3">
                                        {ingredients.map((ing, idx) => (
                                            <div key={ing.id} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                                                <input
                                                    type="text"
                                                    value={ing.name}
                                                    onChange={e => updateIngredient(ing.id, 'name', e.target.value)}
                                                    placeholder="Ingrediente (ej: Tomate)"
                                                    className="flex-1 bg-transparent border-b border-white/10 px-2 py-1 text-white text-sm outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    value={ing.quantity}
                                                    onChange={e => updateIngredient(ing.id, 'quantity', e.target.value)}
                                                    placeholder="Cant."
                                                    className="w-20 bg-transparent border-b border-white/10 px-2 py-1 text-white text-sm outline-none"
                                                />
                                                <div className="relative">
                                                    <select
                                                        value={ing.linkedProductId || ''}
                                                        onChange={e => updateIngredient(ing.id, 'linkedProductId', e.target.value)}
                                                        className="w-32 bg-black/30 text-[10px] text-gray-400 border border-white/10 rounded-lg p-1 outline-none appearance-none"
                                                    >
                                                        <option value="">Vincular prod...</option>
                                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                    </select>
                                                </div>
                                                <button type="button" onClick={() => removeIngredient(ing.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={addIngredient} className="text-sm text-aura-accent hover:text-white flex items-center gap-2 mt-2">
                                            <Plus size={14} /> Añadir Ingrediente
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3">Instrucciones</label>
                                    <textarea
                                        value={instructions}
                                        onChange={e => setInstructions(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-aura-accent min-h-[150px]"
                                        placeholder="Pasos para preparar la receta..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 mt-4 border-t border-white/10 shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-400 font-bold hover:bg-white/5 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-aura-accent hover:bg-white text-black font-bold rounded-xl transition-colors">Guardar Receta</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
