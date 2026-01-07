import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginView from './views/LoginView';
import App from './App';

const AuthenticatedApp: React.FC = () => {
    const { user, loading, migrating } = useAuth();

    // Loading state
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

    // Migration state
    if (migrating) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Sincronizando datos</h2>
                    <p className="text-gray-600 text-sm">
                        Estamos migrando tus datos locales a la nube. Esto solo ocurre una vez.
                    </p>
                </div>
            </div>
        );
    }

    // Show login or main app
    return user ? <App /> : <LoginView />;
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
