import { Timestamp } from 'firebase/firestore';

// --- PRODUCTOS Y ALACENA ---

export interface Product {
    id: string;
    userId: string;
    name: string;
    category: string; // ej: "Fruta", "Lácteos", "Limpieza"
    supermarket?: string; // ej: "Mercadona", "Lidl"
    price?: number;
    lastPriceUpdated?: Timestamp;
    quantity?: string; // ej: "1L", "500g", "Pack de 6"
    // Si fue creado por OCR
    source?: 'manual' | 'ocr';
    imageUrl?: string;
}

// --- RECETAS ---

export interface Ingredient {
    id: string; // unique ID dentro de la receta (ej: uuid)
    name: string; // "Huevos", "Harina"
    quantity?: string; // "2", "300g"
    // Opcional: Enlace a un producto real para calcular coste
    linkedProductId?: string;
}

export interface Recipe {
    id: string;
    userId: string;
    name: string;
    description?: string;
    portions: number;
    ingredients: Ingredient[];
    instructions?: string; // Opcional
    imageUrl?: string;
    tags?: string[]; // "Rápido", "Desayuno"
    // Coste estimado calculado dinámicamente o guardado
    estimatedCost?: number;
    createdAt: Timestamp;
}

// --- PLANIFICACIÓN SEMANAL ---

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface DailyPlan {
    // Ej: { breakfast: [recipeId, recipeId], lunch: [textString] }
    // Permitimos string libre para "Comer fuera" o "Sobras"
    [key: string]: Array<{
        type: 'recipe' | 'text';
        value: string; // ID de receta o Texto libre
        name: string; // Nombre para mostrar rápido
    }>;
}

export interface WeekPlan {
    id: string;
    userId: string;
    // Fecha de inicio (Lunes)
    startDate: string; // YYYY-MM-DD
    days: {
        monday: DailyPlan;
        tuesday: DailyPlan;
        wednesday: DailyPlan;
        thursday: DailyPlan;
        friday: DailyPlan;
        saturday: DailyPlan;
        sunday: DailyPlan;
    };
    generatedShoppingListId?: string;
}

// --- LISTA DE LA COMPRA ---

export interface ShoppingItem {
    id: string;
    name: string;
    quantity?: string; // "2 litros", "3 packs"
    category?: string;
    checked: boolean;
    // Enlace opcional a producto real
    productId?: string;
    // Origen del ítem
    source: 'manual' | 'plan';
    sourceRecipeId?: string; // Si viene de una receta
}

export interface ShoppingList {
    id: string;
    userId: string;
    name: string; // Added for multiple lists
    weekPlanId?: string; // Si está vinculada a un plan
    items: ShoppingItem[];
    status: 'active' | 'archived' | 'completed';
    createdAt: Timestamp;
}
