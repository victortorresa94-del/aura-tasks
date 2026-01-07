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
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [migrating, setMigrating] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
            console.log('👤 Auth State Changed:', currentUser ? `User: ${currentUser.uid} (${currentUser.email})` : 'Logged Out (null)');

            setUser(currentUser);
            setLoading(false);

            // Fix: If user logs out, ensure migrating is false so we don't block UI
            if (!currentUser) {
                console.log('🚪 User logged out, resetting migrating state.');
                setMigrating(false);
                return;
            }

            // Auto-migrate when user logs in
            if (currentUser && !migrating) {
                setMigrating(true);
                try {
                    console.log('🔄 Checking for migration...');
                    await migrateLocalToFirestore(currentUser.uid);
                    console.log('✅ Migration check done');
                } catch (error) {
                    console.error('❌ Migration failed:', error);
                } finally {
                    setMigrating(false);
                }
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
