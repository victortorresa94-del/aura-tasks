import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginView from './views/LoginView';
import App from './App';

const AuthenticatedApp: React.FC = () => {
    const { user, loading, migrating } = useAuth();

    // OPTIMISTIC RENDER: If we have a user (even cached), show App immediately.
    // We ignore 'migrating' state here to prevent blocking, assuming migration can happen in background
    // or has happened already. If strict migration is needed, we'd check a flag.
    if (user) {
        return <App />;
    }

    // Loading state (only shown if no user cached and strictly loading)
    if (loading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg font-semibold">Cargando Aura...</p>
                </div>
            </div>
        );
    }

    // Migration state (fallback if caught here without user, shouldn't happen often with optimistic user)
    if (migrating) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Sincronizando datos</h2>
                    <p className="text-gray-600 text-sm">
                        Estamos preparando tu espacio...
                    </p>
                </div>
            </div>
        );
    }

    // Show login if no user and not loading
    return <LoginView />;
};

import ErrorBoundary from './components/ErrorBoundary';

const AppWithAuth: React.FC = () => {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <AuthenticatedApp />
            </AuthProvider>
        </ErrorBoundary>
    );
};

export default AppWithAuth;
