import React, { useState } from 'react';
import { Calendar, ShoppingCart, Apple, ChefHat, ScanLine } from 'lucide-react';
import { ProductManager } from './ProductManager';
import { RecipeManager } from './RecipeManager';
import { WeeklyPlan } from './WeeklyPlan';
import { ShoppingList } from './ShoppingList';
// import { RecipeManager } from './RecipeManager';

export const NutritionLayout: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'plan' | 'recipes' | 'shop' | 'products'>('plan');

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Nutrition Sub-Nav */}
            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                <button
                    onClick={() => setActiveTab('plan')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${activeTab === 'plan' ? 'bg-aura-accent text-aura-black border-aura-accent font-bold' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                >
                    <Calendar size={18} /> Plan Semanal
                </button>
                <button
                    onClick={() => setActiveTab('shop')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${activeTab === 'shop' ? 'bg-aura-accent text-aura-black border-aura-accent font-bold' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                >
                    <ShoppingCart size={18} /> Lista Compra
                </button>
                <button
                    onClick={() => setActiveTab('recipes')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${activeTab === 'recipes' ? 'bg-aura-accent text-aura-black border-aura-accent font-bold' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                >
                    <ChefHat size={18} /> Recetas
                </button>
                <button
                    onClick={() => setActiveTab('products')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${activeTab === 'products' ? 'bg-aura-accent text-aura-black border-aura-accent font-bold' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                >
                    <Apple size={18} /> Productos
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pb-24">
                {activeTab === 'plan' && (
                    <WeeklyPlan />
                )}
                {activeTab === 'shop' && (
                    <ShoppingList />
                )}
                {activeTab === 'recipes' && (
                    <RecipeManager />
                )}
                {activeTab === 'products' && (
                    <ProductManager />
                )}
            </div>
        </div>
    );
};
