import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import {
    tasksRepo, notesRepo, projectsRepo, contactsRepo, filesRepo, customViewsRepo, statusesRepo
} from './repositories';
import { storage as LocalStorageUtils } from '../utils/storage';

export const migrateLocalToFirestore = async (uid: string) => {
    try {
        // 1. Check if user already migrated
        const userRef = doc(db, `users/${uid}`);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().migratedAt) {
            console.log("User already migrated. Skipping.");
            return;
        }

        console.log("Starting migration from LocalStorage to Firestore...");

        // 2. Read LocalStorage using your existing utility
        // Note: Using 'aura_' prefix as defined in your code
        // We need to fetch each entity manually or use exportAll logic? 
        // Safer to read keys known to the app.

        const tasks = LocalStorageUtils.get<any[]>('tasks', []);
        const notes = LocalStorageUtils.get<any[]>('notes', []);
        const projects = LocalStorageUtils.get<any[]>('projects', []);
        const contacts = LocalStorageUtils.get<any[]>('crm', []); // Key is 'crm' in App.tsx
        const files = LocalStorageUtils.get<any[]>('files', []);
        const views = LocalStorageUtils.get<any[]>('custom_views', []);
        const statuses = LocalStorageUtils.get<any[]>('statuses', []);

        // 3. Upload in Batches
        if (tasks.length) await tasksRepo.batchCreate(uid, tasks);
        if (notes.length) await notesRepo.batchCreate(uid, notes);
        if (projects.length) await projectsRepo.batchCreate(uid, projects);
        if (contacts.length) await contactsRepo.batchCreate(uid, contacts);
        // files here are metadata only, actual binaries are local-only currently so this just syncs the pointers
        if (files.length) await filesRepo.batchCreate(uid, files);
        if (views.length) await customViewsRepo.batchCreate(uid, views);
        if (statuses.length) await statusesRepo.batchCreate(uid, statuses);

        // 4. Mark as migrated
        await setDoc(userRef, {
            migratedAt: Date.now(),
            lastLogin: Date.now()
        }, { merge: true });

        console.log("Migration completed successfully.");

        // Optional: Clear local storage? 
        // localStorage.clear(); 
        // Better to keep it for now as a fallback or manually cleared later.

    } catch (error) {
        console.error("Migration failed:", error);
    }
};
