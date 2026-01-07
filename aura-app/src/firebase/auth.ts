import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Error logging in with Google", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Error signing out", error);
    }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};
