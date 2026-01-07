import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    Timestamp,
    CollectionReference,
    DocumentData,
    writeBatch
} from 'firebase/firestore';
import { db } from '../config';
import { BaseEntity } from '../types';

export class BaseRepository<T extends BaseEntity> {
    private collectionName: string;

    constructor(collectionName: string) {
        this.collectionName = collectionName;
    }

    private getCollectionRef(uid: string): CollectionReference<DocumentData> {
        return collection(db, `users/${uid}/${this.collectionName}`);
    }

    /**
     * Create or Overwrite a document
     */
    async create(uid: string, item: T): Promise<void> {
        const ref = doc(this.getCollectionRef(uid), item.id);
        const now = Date.now();
        const data = {
            ...item,
            ownerId: uid,
            createdAt: item.createdAt || now,
            updatedAt: now,
            deletedAt: null
        };
        await setDoc(ref, data);
    }

    /**
     * Update partial fields
     */
    async update(uid: string, id: string, updates: Partial<T>): Promise<void> {
        const ref = doc(this.getCollectionRef(uid), id);
        await updateDoc(ref, {
            ...updates,
            updatedAt: Date.now()
        });
    }

    /**
     * Delete (Soft or Hard based on requirements) - implementation is Hard Delete here
     */
    async delete(uid: string, id: string): Promise<void> {
        const ref = doc(this.getCollectionRef(uid), id);
        await deleteDoc(ref);
    }

    /**
     * Real-time subscription to the collection
     */
    subscribe(uid: string, callback: (items: T[]) => void, onError?: (error: Error) => void): () => void {
        const q = query(this.getCollectionRef(uid), where("deletedAt", "==", null));

        return onSnapshot(q, (snapshot) => {
            const items: T[] = [];
            snapshot.forEach((doc) => {
                items.push(doc.data() as T);
            });
            callback(items);
        }, (error) => {
            console.error(`Firestore subscription error for ${this.collectionName}:`, error);
            if (onError) onError(error);
        });
    }

    /**
     * Batch create helper for migration
     */
    async batchCreate(uid: string, items: T[]) {
        const batch = writeBatch(db);
        const colRef = this.getCollectionRef(uid);

        items.forEach(item => {
            const ref = doc(colRef, item.id);
            const now = Date.now();
            const data = {
                ...item,
                ownerId: uid,
                createdAt: item.createdAt || now,
                updatedAt: now,
                deletedAt: null
            };
            batch.set(ref, data);
        });

        await batch.commit();
    }
}
