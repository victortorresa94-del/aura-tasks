import React, { useState, useEffect } from 'react';
import { Plus, Search, Camera, Edit3, Trash2, Tag, Euro, ShoppingBag, X, ChevronDown } from 'lucide-react';
import { Product } from '../../../types/nutrition';
import { nutritionService } from '../../../services/nutritionService';
import { useAuth } from '../../../contexts/AuthContext';

export const ProductManager: React.FC = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [name, setName] = useState('');
    const [category, setCategory] = useState('General');
    const [supermarket, setSupermarket] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');

    useEffect(() => {
        if (user) loadProducts();
    }, [user]);

    const loadProducts = async () => {
        if (!user) return;
        const data = await nutritionService.getUserProducts(user.uid);
        setProducts(data);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supermarket?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const productData = {
            name,
            category,
            supermarket,
            price: parseFloat(price) || 0,
            quantity,
            source: 'manual' as const
        };

        if (editingProduct) {
            await nutritionService.updateProduct(editingProduct.id, productData);
        } else {
            await nutritionService.createProduct(user.uid, productData);
        }

        setIsModalOpen(false);
        resetForm();
        loadProducts();
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setName(product.name);
        setCategory(product.category);
        setSupermarket(product.supermarket || '');
        setPrice(product.price?.toString() || '');
        setQuantity(product.quantity || '');
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingProduct(null);
        setName('');
        setCategory('General');
        setSupermarket('');
        setPrice('');
        setQuantity('');
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white outline-none focus:border-aura-accent transition-colors"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors" title="Escanear (Coming Soon)">
                        <Camera size={20} />
                    </button>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-aura-accent text-aura-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <Plus size={18} /> Nuevo
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                    <div key={product.id} className="bg-aura-gray/30 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all group relative">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{product.category}</span>
                            <button onClick={() => handleEdit(product)} className="text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={14} /></button>
                        </div>

                        <h3 className="font-bold text-white text-lg mb-1">{product.name}</h3>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <ShoppingBag size={14} />
                                <span>{product.supermarket || 'Sin super asignado'}</span>
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                                <span className="text-sm text-gray-500">{product.quantity || '-'}</span>
                                <span className="font-bold text-emerald-400 text-lg">{product.price?.toFixed(2)}€</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal - Full Screen Mobile / Centered Desktop */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center sm:p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in"
                        onClick={() => setIsModalOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full h-[100dvh] sm:h-auto sm:max-w-lg bg-[#121212] sm:rounded-3xl flex flex-col shadow-2xl animate-slide-up border border-white/10">

                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                            <div>
                                <h3 className="text-2xl font-bold text-white">
                                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                                </h3>
                                <p className="text-sm text-gray-400">Detalles del artículo</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Form */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Nombre</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-aura-accent focus:bg-white/10 transition-all font-medium text-lg"
                                    placeholder="Ej: Avena"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Categoría</label>
                                    <div className="relative">
                                        <select
                                            value={category}
                                            onChange={e => setCategory(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-aura-accent appearance-none transition-colors"
                                        >
                                            <option value="General">General</option>
                                            <option value="Frutas">Frutas</option>
                                            <option value="Verduras">Verduras</option>
                                            <option value="Carne">Carne</option>
                                            <option value="Pescado">Pescado</option>
                                            <option value="Lácteos">Lácteos</option>
                                            <option value="Despensa">Despensa</option>
                                            <option value="Limpieza">Limpieza</option>
                                            <option value="Higiene">Higiene</option>
                                            <option value="Bebidas">Bebidas</option>
                                            <option value="Snacks">Snacks</option>
                                            <option value="Otros">Otros</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Cant./Peso</label>
                                    <input
                                        type="text"
                                        value={quantity}
                                        onChange={e => setQuantity(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-aura-accent"
                                        placeholder="Ej: 500g"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Supermercado</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            value={supermarket}
                                            onChange={e => setSupermarket(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-aura-accent"
                                            placeholder="Mercadona"
                                        />
                                        <ShoppingBag size={16} className="absolute left-3 text-gray-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Precio (€)</label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={price}
                                            onChange={e => setPrice(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white outline-none focus:border-aura-accent"
                                            placeholder="0.00"
                                        />
                                        <span className="absolute left-3 text-gray-500 text-lg">€</span>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-white/10 bg-[#121212] shrink-0 pb-safe">
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 text-gray-400 font-bold hover:bg-white/5 rounded-2xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!name.trim()}
                                    className="flex-1 py-4 bg-aura-accent text-black font-bold rounded-2xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(212,225,87,0.2)] disabled:opacity-50 disabled:shadow-none"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
