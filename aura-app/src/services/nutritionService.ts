import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    query,
    where,
    DeleteField,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Product, Recipe, WeekPlan, ShoppingList } from '../types/nutrition';

// Helper
const convertData = (doc: any) => ({ id: doc.id, ...doc.data() });

export const nutritionService = {

    // --- PRODUCTOS ---

    async createProduct(userId: string, data: Omit<Product, 'id' | 'userId'>) {
        const ref = collection(db, 'products');
        const newProduct = { ...data, userId, lastPriceUpdated: Timestamp.now() };
        const docRef = await addDoc(ref, newProduct);
        return { id: docRef.id, ...newProduct };
    },

    async getUserProducts(userId: string) {
        const q = query(collection(db, 'products'), where('userId', '==', userId));
        const snap = await getDocs(q);
        return snap.docs.map(convertData) as Product[];
    },

    async updateProduct(productId: string, data: Partial<Product>) {
        const ref = doc(db, 'products', productId);
        await updateDoc(ref, {
            ...data,
            lastPriceUpdated: data.price ? Timestamp.now() : undefined
        });
    },

    // --- RECETAS ---

    async createRecipe(userId: string, data: Omit<Recipe, 'id' | 'userId' | 'createdAt'>) {
        const ref = collection(db, 'recipes');
        const newRecipe = { ...data, userId, createdAt: Timestamp.now() };
        const docRef = await addDoc(ref, newRecipe);
        return { id: docRef.id, ...newRecipe };
    },

    async getUserRecipes(userId: string) {
        const q = query(collection(db, 'recipes'), where('userId', '==', userId));
        const snap = await getDocs(q);
        return snap.docs.map(convertData) as Recipe[];
    },

    // --- PLANIFICACIÓN SEMANAL ---

    async getWeekPlan(userId: string, startDate: string) {
        const q = query(
            collection(db, 'week_plans'),
            where('userId', '==', userId),
            where('startDate', '==', startDate)
        );
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return convertData(snap.docs[0]) as WeekPlan;
    },

    async saveWeekPlan(userId: string, planData: Omit<WeekPlan, 'id' | 'userId'>) {
        // Check if exists first to update or create
        const existing = await this.getWeekPlan(userId, planData.startDate);
        const ref = collection(db, 'week_plans');

        if (existing) {
            await updateDoc(doc(db, 'week_plans', existing.id), planData);
            return { ...existing, ...planData };
        } else {
            const newPlan = { ...planData, userId };
            const docRef = await addDoc(ref, newPlan);
            return { id: docRef.id, ...newPlan };
        }
    },

    // --- LISTA DE LA COMPRA ---

    async getShoppingLists(userId: string) {
        const q = query(
            collection(db, 'shopping_lists'),
            where('userId', '==', userId),
            where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        return snap.docs.map(convertData) as ShoppingList[];
    },

    async getActiveShoppingList(userId: string) {
        // Now returns the first active list or null
        const lists = await this.getShoppingLists(userId);
        return lists.length > 0 ? lists[0] : null;
    },

    async createOrUpdateShoppingList(userId: string, items: ShoppingList['items'], listId?: string, name: string = 'Lista General') {
        const ref = collection(db, 'shopping_lists');

        if (listId) {
            await updateDoc(doc(db, 'shopping_lists', listId), { items });
            // Return updated structure mocked (or fetch it)
            return { id: listId, userId, items, status: 'active', name, createdAt: Timestamp.now() } as ShoppingList;
        } else {
            const newList = {
                userId,
                name,
                items,
                status: 'active',
                createdAt: Timestamp.now()
            };
            const docRef = await addDoc(ref, newList);
            return { id: docRef.id, ...newList } as ShoppingList;
        }
    },

    // --- RECENT MEALS HISTORY ---

    async getRecentMealItems(userId: string, limitCount = 50) {
        // Fetch last 4 week plans
        // Note: Firestore orderBy on string dates (YYYY-MM-DD) works lexicographically
        const q = query(
            collection(db, 'week_plans'),
            where('userId', '==', userId),
            // orderBy('startDate', 'desc'), // Needs index, might fail without it. 
            // We'll client-side filter or assume small dataset for now or try-catch.
            // Safest without index is just get all (usually few) and sort in code.
        );
        const snap = await getDocs(q);
        const plans = snap.docs.map(convertData) as WeekPlan[];

        // Sort DESC
        plans.sort((a, b) => b.startDate.localeCompare(a.startDate));

        const recentItems: { type: 'recipe' | 'text', value: string, name: string }[] = [];
        const seen = new Set<string>();

        // Days iteration
        const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const meals = ['breakfast', 'lunch', 'dinner'];

        for (const plan of plans) {
            for (const day of dayKeys) {
                const dayPlan = plan.days[day as keyof typeof plan.days] as any;
                if (!dayPlan) continue;
                for (const meal of meals) {
                    const items = dayPlan[meal] || [];
                    for (const item of items) {
                        const key = `${item.type}:${item.value}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            recentItems.push(item);
                            if (recentItems.length >= limitCount) return recentItems;
                        }
                    }
                }
            }
        }
        return recentItems;
    }
};
