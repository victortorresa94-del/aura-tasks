import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { subscribeToAuthChanges } from '../firebase/auth';
import { migrateLocalToFirestore } from '../firebase/migration';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    migrating: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    migrating: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // OPTIMISTIC INIT: Check localStorage first
    const [user, setUser] = useState<User | null>(() => {
        const cached = localStorage.getItem('aura_user_cache');
        return cached ? JSON.parse(cached) : null;
    });

    // If we have a cached user, we are NOT loading initially from user perspective
    const [loading, setLoading] = useState(() => !localStorage.getItem('aura_user_cache'));
    const [migrating, setMigrating] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
            console.log('👤 Auth State Changed:', currentUser ? `User: ${currentUser.uid}` : 'Logged Out');

            if (currentUser) {
                // UPDATE CACHE
                // Serializing complex Firebase User object might be tricky, 
                // but usually we just need basic props or the object effectively treats itself as JSON-able.
                // Safest to store a simplified version or rely on standard serialization if it works.
                // For Aura, we need uid, email, photoURL mostly.
                // Be careful: JSON.stringify(currentUser) might miss proto methods, 
                // but usually works for simple property access in UI. 
                // Better approach: serialize what we need or let it be.
                // Firebase SDK user objects are technically complex, but let's try storing the JSON representation.
                localStorage.setItem('aura_user_cache', JSON.stringify(currentUser));
                setUser(currentUser);
                setLoading(false);

                // Auto-migrate
                if (!migrating) {
                    // Don't set migrating=true here blindly if we are already seeing the dashboard.
                    // Ideally migration happens silently in background unless it's critical.
                    // For now, let's keep it silent unless it fails or we want to block?
                    // Use a flag in storage to check if migration needed? 
                    // For this speed optimization, let's run it without blocking UI state if possible,
                    // OR only block if we know we are fresh. 
                    // Current logic:
                    // setMigrating(true); // This causes Flicker of "Sincronizando..."
                    // Let's run it silently for now, as user wants SPEED.
                    migrateLocalToFirestore(currentUser.uid).catch(console.error);
                }

            } else {
                // LOGOUT
                localStorage.removeItem('aura_user_cache');
                setUser(null);
                setLoading(false);
                setMigrating(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, migrating }}>
            {children}
        </AuthContext.Provider>
    );
};
