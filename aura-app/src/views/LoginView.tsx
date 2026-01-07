import React, { useState } from 'react';
import { Sparkles, LogIn } from 'lucide-react';
import { loginWithGoogle } from '../firebase/auth';
import { AURA_IMAGE } from '../utils/constants';

const LoginView: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setError(null);
            await loginWithGoogle();
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
            {/* Animated Background Circles */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-1/2 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-8 text-white text-center">
                        <div className="flex justify-center mb-4">
                            <img
                                src={AURA_IMAGE}
                                alt="Aura"
                                className="w-20 h-20 rounded-full border-4 border-white/30 shadow-lg"
                            />
                        </div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
                            <Sparkles size={28} />
                            Aura Tasks
                        </h1>
                        <p className="text-indigo-100 text-sm">
                            Tu asistente inteligente de productividad
                        </p>
                    </div>

                    {/* Body */}
                    <div className="p-8">
                        <div className="mb-6 text-center">
                            <h2 className="text-xl font-bold text-gray-800 mb-2">
                                Bienvenido de vuelta
                            </h2>
                            <p className="text-gray-500 text-sm">
                                Inicia sesión para sincronizar tus tareas en todos tus dispositivos
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Google Login Button */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
                                    Iniciando sesión...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Continuar con Google
                                </>
                            )}
                        </button>

                        {/* Features */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <div className="space-y-3">
                                {[
                                    '✨ Sincronización automática en la nube',
                                    '🔒 Tus datos protegidos y seguros',
                                    '📱 Accede desde cualquier dispositivo'
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-white/70 text-xs mt-6">
                    Al iniciar sesión, aceptas nuestros Términos de Servicio y Política de Privacidad
                </p>
            </div>
        </div>
    );
};

export default LoginView;
