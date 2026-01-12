import React, { useState, useEffect } from 'react';
import { Plus, Search, Camera, Edit3, Trash2, Tag, Euro, ShoppingBag } from 'lucide-react';
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
                    <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-md p-8 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold text-white mb-6">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Nombre</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/30 border-b border-white/10 py-2 text-white outline-none focus:border-aura-accent" placeholder="Ej: Avituallamiento" autoFocus required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Categoría</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-black/30 border-b border-white/10 py-2 text-white outline-none">
                                        <option value="General">General</option>
                                        <option value="Frutas">Frutas</option>
                                        <option value="Verduras">Verduras</option>
                                        <option value="Carne">Carne</option>
                                        <option value="Pescado">Pescado</option>
                                        <option value="Lácteos">Lácteos</option>
                                        <option value="Despensa">Despensa</option>
                                        <option value="Limpieza">Limpieza</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Cant./Peso</label>
                                    <input type="text" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-black/30 border-b border-white/10 py-2 text-white outline-none" placeholder="Ej: 1kg" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Supermercado</label>
                                    <input type="text" value={supermarket} onChange={e => setSupermarket(e.target.value)} className="w-full bg-black/30 border-b border-white/10 py-2 text-white outline-none" placeholder="Ej: Mercadona" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Precio (€)</label>
                                    <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-black/30 border-b border-white/10 py-2 text-white outline-none" placeholder="0.00" />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-400 font-bold hover:bg-white/5 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-aura-accent hover:bg-white text-black font-bold rounded-xl transition-colors">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
