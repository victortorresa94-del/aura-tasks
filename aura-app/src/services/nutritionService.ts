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

    async getActiveShoppingList(userId: string) {
        const q = query(
            collection(db, 'shopping_lists'),
            where('userId', '==', userId),
            where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        if (snap.empty) return null;
        return convertData(snap.docs[0]) as ShoppingList;
    },

    async createOrUpdateShoppingList(userId: string, items: ShoppingList['items']) {
        const current = await this.getActiveShoppingList(userId);
        const ref = collection(db, 'shopping_lists');

        if (current) {
            await updateDoc(doc(db, 'shopping_lists', current.id), { items });
            return { ...current, items };
        } else {
            const newList = {
                userId,
                items,
                status: 'active',
                createdAt: Timestamp.now()
            };
            const docRef = await addDoc(ref, newList);
            return { id: docRef.id, ...newList };
        }
    }
};
