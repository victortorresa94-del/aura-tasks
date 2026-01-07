import { initializeApp } from 'firebase/app';
import {
    getAuth,
    setPersistence,
    browserLocalPersistence,
    connectAuthEmulator
} from 'firebase/auth';
import {
    getFirestore,
    enableIndexedDbPersistence,
    connectFirestoreEmulator
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Configuración directa (Hardcoded) para evitar errores de .env
const firebaseConfig = {
    apiKey: "AIzaSyADVBVjyLik8D54SLlE9-8jqkKV5JlRl_I",
    authDomain: "aether-app-59bd1.firebaseapp.com",
    projectId: "aether-app-59bd1",
    storageBucket: "aether-app-59bd1.firebasestorage.app",
    messagingSenderId: "462116144844",
    appId: "1:462116144844:web:b1985be915ecbeffe36469",
    measurementId: "G-FS5M5KJ7WF"
};

console.log('🔥 Initializing Firebase with direct config...');

let app;
let auth;
let db;
let storage;

try {
    // Initialize App
    app = initializeApp(firebaseConfig);

    // Initialize Services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Set Persistence
    setPersistence(auth, browserLocalPersistence);

    // Enable Offline Persistence
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Persistence failed: Multiple tabs open');
        } else if (err.code == 'unimplemented') {
            console.warn('Persistence not supported by browser');
        }
    });

    console.log('✅ Firebase initialized successfully!');

} catch (error) {
    console.error('❌ Critical Firebase Error:', error);
    throw error;
}

export { auth, db, storage };
