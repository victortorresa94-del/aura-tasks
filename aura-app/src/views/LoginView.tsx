import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loginWithGoogle } from '../firebase/auth';
import { Sparkles, ArrowRight, Mic, Music, Mail, Zap, Calendar, CheckCircle2, Play, Users, BarChart3, FileText, Target } from 'lucide-react';
import logo from '../assets/logo.png';
import logoTransparent from '../assets/logo-transparent.png';

export default function LoginView() {
    const { loading } = useAuth();

    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                    entry.target.classList.remove('opacity-0', 'translate-y-10');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal').forEach(el => {
            el.classList.add('opacity-0', 'translate-y-10', 'transition-all', 'duration-700');
            observerRef.current?.observe(el);
        });

        return () => observerRef.current?.disconnect();
    }, []);

    const handleLogin = async () => {
        try {
            await loginWithGoogle();
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    return (
        <div className="h-screen w-full bg-black text-aura-white selection:bg-aura-accent selection:text-aura-black overflow-y-auto overflow-x-hidden font-sans flex flex-col scroll-smooth">

            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-md bg-black/80 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <img src={logo} alt="Aura Logo" className="w-8 h-8 rounded-full" />
                    <span className="font-bold text-lg tracking-tight">Aura</span>
                </div>
                <button onClick={handleLogin} className="text-sm font-medium px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-colors">
                    Iniciar Sesión
                </button>
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="min-h-screen relative flex items-center justify-center pt-20 overflow-hidden bg-black">
                {/* Subtle glow behind logo area */}
                <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-aura-accent/10 rounded-full blur-[200px] -z-10 pointer-events-none"></div>

                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="flex flex-col items-start text-left z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-aura-accent mb-8 animate-fade-in-up">
                            <Sparkles size={12} />
                            <span>La nueva era de la productividad</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight mb-8 leading-[1.15] animate-fade-in-up [animation-delay:100ms]">
                            <span className="text-white">Organiza tu vida</span><br />
                            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-aura-cyan via-aura-accent to-aura-emerald">con Aura</span>
                        </h1>

                        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-lg font-light leading-relaxed animate-fade-in-up [animation-delay:200ms]">
                            Más que una lista de tareas. Es un sistema vivo que escucha, organiza y actúa por ti.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up [animation-delay:300ms] w-full sm:w-auto">
                            <button
                                onClick={handleLogin}
                                className="w-full sm:w-auto group relative flex items-center justify-center gap-3 px-8 py-4 bg-aura-white text-aura-black rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                            >
                                <span>Empezar Gratis</span>
                                <ArrowRight size={20} className="text-aura-black group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="w-full sm:w-auto px-8 py-4 text-gray-400 hover:text-white font-medium transition-colors border border-transparent hover:border-white/10 rounded-2xl">
                                Ver Demo
                            </button>
                        </div>

                        {/* Social Proof */}
                        <div className="mt-12 flex items-center gap-4 text-sm text-gray-500 animate-fade-in-up [animation-delay:400ms]">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="w-9 h-9 rounded-full bg-aura-gray border-2 border-black overflow-hidden">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 10}`} alt="user" className="w-full h-full" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-gray-400">Únete a <span className="text-white font-semibold">+2,000</span> usuarios</p>
                        </div>
                    </div>

                    {/* Right Content: Transparent Logo */}
                    <div className="relative flex justify-center items-center animate-fade-in-right">
                        {/* Logo - transparent background, no blend mode needed */}
                        <div className="relative z-10 w-64 h-64 md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] flex items-center justify-center">
                            <img
                                src={logoTransparent}
                                className="w-full h-full object-contain animate-float drop-shadow-[0_0_60px_rgba(45,212,191,0.4)]"
                                alt="Aura Logo"
                            />
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-gray-500">
                    <span className="text-xs uppercase tracking-widest mb-2 block text-center">Descubre</span>
                    <ArrowRight className="rotate-90 mx-auto" size={20} />
                </div>
            </section>

            {/* --- BANNER 1: AURA AI --- */}
            <section className="min-h-screen flex items-center py-24 bg-gradient-to-b from-black to-aura-gray/10 border-t border-white/5">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1 reveal">
                        <div className="bg-black border border-white/10 rounded-3xl p-6 shadow-2xl max-w-md mx-auto transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                                <div className="w-3 h-3 rounded-full bg-aura-accent/50"></div>
                                <div className="w-3 h-3 rounded-full bg-aura-accent/30"></div>
                                <div className="w-3 h-3 rounded-full bg-aura-accent/20"></div>
                                <span className="text-xs text-gray-500 ml-auto">Aura Intelligence</span>
                            </div>
                            <div className="space-y-4 font-mono text-sm">
                                <div className="flex gap-3 justify-end">
                                    <div className="bg-white/10 text-white p-3 rounded-2xl rounded-tr-none max-w-[80%]">Oye Aura, mueve todas mis reuniones de la tarde para mañana.</div>
                                    <div className="w-8 h-8 rounded-full bg-aura-gray shrink-0"></div>
                                </div>
                                <div className="flex gap-2 items-center text-xs text-aura-accent animate-pulse px-2"><Sparkles size={12} /><span>Procesando solicitud...</span></div>
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-aura-accent/20 flex items-center justify-center text-aura-accent shrink-0"><Sparkles size={14} /></div>
                                    <div className="bg-aura-gray text-aura-white border border-aura-accent/20 p-3 rounded-2xl rounded-tl-none w-full">
                                        <p className="mb-2">Hecho. He reprogramado 3 reuniones:</p>
                                        <ul className="space-y-2 mb-2">
                                            <li className="flex items-center gap-2 bg-black/20 p-2 rounded border border-white/5 text-xs text-gray-300"><Calendar size={12} className="text-aura-accent" /> <span className="line-through opacity-50">Hoy 16:00</span> <ArrowRight size={10} /> <span className="text-aura-accent">Mañana 10:00</span></li>
                                        </ul>
                                        <p className="text-xs text-gray-400">¿Necesitas que notifique a los asistentes?</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex items-center gap-2 bg-black/30 p-2 rounded-xl border border-white/5 text-gray-500 text-xs"><Mic size={14} /><span>Presiona espacio para hablar...</span></div>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2 reveal">
                        <div className="flex items-center gap-2 text-aura-accent mb-4 font-bold tracking-wider uppercase text-sm"><Zap size={16} /> IA En Todo el Sistema</div>
                        <h2 className="text-4xl md:text-6xl font-light mb-6">Tu Segundo Cerebro, <span className="font-semibold text-gray-500">Literalmente.</span></h2>
                        <p className="text-xl text-gray-400 mb-8 leading-relaxed font-light">
                            No es solo un chat lateral. Aura tiene control total sobre tu agenda y tareas.
                            <span className="text-aura-accent block mt-4 font-medium">✨ Realiza una "Revisión Diaria" por voz mientras desayunas.</span>
                            <span className="text-aura-accent block mt-2 font-medium">✨ Reorganiza semanas enteras con una sola frase.</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* --- BANNER 2: PODERES EXTRA --- */}
            <section className="min-h-screen flex items-center py-24 bg-black relative overflow-hidden">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-aura-accent/5 rounded-full blur-[150px] pointer-events-none"></div>
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20 reveal">
                        <h2 className="text-4xl md:text-6xl font-light mb-4">Poderes que <span className="font-semibold text-aura-accent">no esperabas</span></h2>
                        <p className="text-gray-400 text-lg">Esas pequeñas funcionalidades que marcan la diferencia.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="reveal bg-aura-gray/20 border border-white/5 rounded-3xl p-8 hover:bg-aura-gray/30 transition-all hover:scale-[1.02] group">
                            <div className="w-14 h-14 bg-aura-accent/10 text-aura-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Music size={28} /></div>
                            <h3 className="text-2xl font-semibold mb-3">DJ Personal</h3>
                            <p className="text-gray-400 mb-6">Conecta tu Spotify. Aura elige la música perfecta para tu sesión de Deep Work.</p>
                            <div className="bg-black/40 rounded-xl p-3 flex items-center gap-3 border border-white/5">
                                <div className="w-10 h-10 bg-aura-gray rounded-lg animate-pulse"></div>
                                <div className="flex-1 min-w-0"><div className="h-2 w-20 bg-gray-500 rounded mb-1.5"></div><div className="h-2 w-12 bg-gray-700 rounded"></div></div>
                                <Play size={16} fill="currentColor" className="text-aura-accent" />
                            </div>
                        </div>
                        <div className="reveal bg-aura-gray/20 border border-white/5 rounded-3xl p-8 hover:bg-aura-gray/30 transition-all hover:scale-[1.02] group [transition-delay:100ms]">
                            <div className="w-14 h-14 bg-aura-accent/10 text-aura-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Mail size={28} /></div>
                            <h3 className="text-2xl font-semibold mb-3">Comunicación Directa</h3>
                            <p className="text-gray-400 mb-6">¿Tienes una tarea de "Escribir a Juan"? Hazlo desde aquí. Envía correos de Gmail sin abrir otra pestaña.</p>
                            <div className="flex items-center gap-2 bg-aura-accent/10 text-aura-accent px-4 py-3 rounded-xl border border-aura-accent/20 text-sm font-bold justify-center"><Mail size={16} /><span>Redactar correo a Juan</span></div>
                        </div>
                        <div className="reveal bg-aura-gray/20 border border-white/5 rounded-3xl p-8 hover:bg-aura-gray/30 transition-all hover:scale-[1.02] group [transition-delay:200ms]">
                            <div className="w-14 h-14 bg-aura-accent/10 text-aura-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Mic size={28} /></div>
                            <h3 className="text-2xl font-semibold mb-3">Manos Libres Real</h3>
                            <p className="text-gray-400 mb-6">"Aura, léeme la agenda de hoy". Perfecto para cuando vas conduciendo o preparando el café.</p>
                            <div className="flex gap-1 justify-center items-end h-8"><div className="w-1 bg-aura-accent h-3 animate-[pulse_1s_ease-in-out_infinite]"></div><div className="w-1 bg-aura-accent h-6 animate-[pulse_1.2s_ease-in-out_infinite]"></div><div className="w-1 bg-aura-accent h-8 animate-[pulse_0.8s_ease-in-out_infinite]"></div><div className="w-1 bg-aura-accent h-4 animate-[pulse_1.5s_ease-in-out_infinite]"></div><div className="w-1 bg-aura-accent h-3 animate-[pulse_1s_ease-in-out_infinite]"></div></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- BANNER 3: FLUJO DE TRABAJO --- */}
            <section className="min-h-screen flex items-center py-24 border-t border-white/5 bg-black">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="reveal">
                        <div className="flex items-center gap-2 text-aura-accent mb-4 font-bold tracking-wider uppercase text-sm"><CheckCircle2 size={16} /> Gestión Superior</div>
                        <h2 className="text-4xl md:text-6xl font-light mb-6">Flujo de Trabajo <br /><span className="font-semibold text-aura-accent">Líquido</span></h2>
                        <p className="text-xl text-gray-400 mb-8 leading-relaxed font-light">
                            Olvídate de interfaces rígidas. Kanban, Calendario y Listas conviven en armonía. Arrastra una tarea al calendario para bloquear tiempo.<br /><br />Todo fluye, nada estorba.
                        </p>
                    </div>
                    <div className="reveal relative">
                        <div className="absolute inset-0 bg-aura-accent/5 blur-3xl -z-10 rounded-full"></div>
                        <div className="bg-aura-gray/30 border border-white/10 rounded-2xl p-2 shadow-2xl relative overflow-hidden">
                            <div className="flex justify-between items-center p-4 border-b border-white/5">
                                <div className="flex gap-2"><div className="px-3 py-1 bg-aura-accent text-aura-black font-bold rounded-lg text-xs">Tablero</div><div className="px-3 py-1 text-gray-400 rounded-lg text-xs hover:bg-white/5">Calendario</div></div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 p-4 h-64 overflow-hidden">
                                <div className="bg-white/5 rounded-xl p-3"><div className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Por hacer</div><div className="bg-aura-gray border border-white/5 p-3 rounded-lg shadow-sm mb-2 text-sm text-gray-300">Diseñar Landing Page</div><div className="bg-aura-gray border border-white/5 p-3 rounded-lg shadow-sm mb-2 text-sm text-gray-300">Integrar Stripe</div></div>
                                <div className="bg-white/5 rounded-xl p-3"><div className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">En Progreso</div><div className="bg-aura-gray border-l-2 border-aura-accent p-3 rounded-lg shadow-lg mb-2 text-sm text-white font-medium">Optimizar Mobile</div></div>
                                <div className="bg-white/5 rounded-xl p-3 flex items-center justify-center"><span className="text-xs text-gray-600 font-medium">Hecho</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- BANNER 4: CRM INTEGRADO --- */}
            <section className="min-h-screen flex items-center py-24 bg-gradient-to-b from-black to-aura-gray/5 border-t border-white/5">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="reveal relative order-2 lg:order-1">
                        <div className="bg-aura-gray/30 border border-white/10 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center gap-3 mb-6"><Users size={20} className="text-aura-accent" /><span className="font-bold text-lg">Contactos</span></div>
                            {['María García', 'Carlos López', 'Ana Martín'].map((name, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 bg-black/50 rounded-xl mb-2 border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-aura-accent/20 flex items-center justify-center font-bold text-aura-accent">{name.charAt(0)}</div>
                                    <div className="flex-1"><div className="font-medium text-white">{name}</div><div className="text-xs text-gray-500">Última interacción: hace {i + 1} días</div></div>
                                    <button className="text-xs bg-aura-accent/10 text-aura-accent px-3 py-1.5 rounded-lg border border-aura-accent/20">Seguimiento</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="order-1 lg:order-2 reveal">
                        <div className="flex items-center gap-2 text-aura-accent mb-4 font-bold tracking-wider uppercase text-sm"><Users size={16} /> CRM Personal</div>
                        <h2 className="text-4xl md:text-6xl font-light mb-6">Nunca olvides <br /><span className="font-semibold text-aura-accent">una relación</span></h2>
                        <p className="text-xl text-gray-400 mb-8 leading-relaxed font-light">
                            Mantén el pulso de tus contactos profesionales y personales. Aura te recuerda cuándo fue la última vez que hablaste con alguien importante.
                        </p>
                    </div>
                </div>
            </section>

            {/* --- BANNER 5: INSIGHTS --- */}
            <section className="min-h-screen flex items-center py-24 border-t border-white/5 bg-black">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="reveal">
                        <div className="flex items-center gap-2 text-aura-accent mb-4 font-bold tracking-wider uppercase text-sm"><BarChart3 size={16} /> Insights Profundos</div>
                        <h2 className="text-4xl md:text-6xl font-light mb-6">Entiende tu <br /><span className="font-semibold text-aura-accent">productividad</span></h2>
                        <p className="text-xl text-gray-400 mb-8 leading-relaxed font-light">
                            Gráficos de rendimiento semanal, resúmenes automáticos de tu jornada, y análisis de dónde se va tu tiempo. Datos reales para decisiones reales.
                        </p>
                    </div>
                    <div className="reveal relative">
                        <div className="bg-aura-gray/30 border border-white/10 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-6"><span className="font-bold text-lg">Productividad Semanal</span><span className="text-xs text-gray-500">Esta semana</span></div>
                            <div className="flex items-end gap-2 h-40 mb-4">
                                {[40, 65, 80, 55, 90, 70, 85].map((h, i) => (
                                    <div key={i} className="flex-1 bg-gradient-to-t from-aura-accent/80 to-aura-accent rounded-t-lg transition-all duration-500 hover:from-aura-accent hover:to-emerald-400" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">{['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <span key={d}>{d}</span>)}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- BANNER 6: NOTAS --- */}
            <section className="min-h-screen flex items-center py-24 bg-gradient-to-b from-black to-aura-gray/5 border-t border-white/5">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="reveal relative order-2 lg:order-1">
                        <div className="bg-aura-gray/30 border border-white/10 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center gap-3 mb-6"><FileText size={20} className="text-aura-accent" /><span className="font-bold text-lg">Notas</span></div>
                            <div className="bg-black/50 rounded-xl p-4 border border-white/5 font-mono text-sm">
                                <div className="text-lg font-bold text-white mb-2">📝 Reunión con Cliente</div>
                                <p className="text-gray-400 mb-4">Puntos clave discutidos en la reunión del lunes...</p>
                                <div className="flex gap-2"><span className="bg-aura-accent/10 text-aura-accent px-2 py-1 rounded text-xs">#proyecto-alfa</span><span className="bg-aura-accent/10 text-aura-accent px-2 py-1 rounded text-xs">#cliente</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2 reveal">
                        <div className="flex items-center gap-2 text-aura-accent mb-4 font-bold tracking-wider uppercase text-sm"><FileText size={16} /> Notas Inteligentes</div>
                        <h2 className="text-4xl md:text-6xl font-light mb-6">Captura ideas <br /><span className="font-semibold text-aura-accent">sin esfuerzo</span></h2>
                        <p className="text-xl text-gray-400 mb-8 leading-relaxed font-light">
                            Editor de bloques al estilo Notion. Vincula notas a tareas, proyectos y contactos. Todo conectado, todo buscable.
                        </p>
                    </div>
                </div>
            </section>

            {/* --- BANNER 7: HÁBITOS --- */}
            <section className="min-h-screen flex items-center py-24 border-t border-white/5 bg-black">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="reveal">
                        <div className="flex items-center gap-2 text-aura-accent mb-4 font-bold tracking-wider uppercase text-sm"><Target size={16} /> Hábitos</div>
                        <h2 className="text-4xl md:text-6xl font-light mb-6">Construye la vida <br /><span className="font-semibold text-aura-accent">que quieres</span></h2>
                        <p className="text-xl text-gray-400 mb-8 leading-relaxed font-light">
                            Trackea hábitos diarios con rachas motivadoras. Aura te recuerda en el momento perfecto y celebra tus victorias.
                        </p>
                    </div>
                    <div className="reveal relative">
                        <div className="bg-aura-gray/30 border border-white/10 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-6"><span className="font-bold text-lg">Mis Hábitos</span><span className="text-xs bg-aura-accent/10 text-aura-accent px-2 py-1 rounded-lg">🔥 12 días</span></div>
                            {[{ name: 'Meditación', done: true }, { name: 'Lectura 30min', done: true }, { name: 'Ejercicio', done: false }].map((h, i) => (
                                <div key={i} className={`flex items-center gap-4 p-3 rounded-xl mb-2 border ${h.done ? 'bg-aura-accent/10 border-aura-accent/20' : 'bg-black/50 border-white/5'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${h.done ? 'bg-aura-accent text-aura-black' : 'border-2 border-gray-500'}`}>{h.done && <CheckCircle2 size={14} />}</div>
                                    <span className={h.done ? 'text-aura-accent font-medium' : 'text-gray-400'}>{h.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA SECTION --- */}
            <section className="py-32 px-6 text-center bg-gradient-to-t from-aura-accent/5 to-black border-t border-white/5">
                <div className="reveal max-w-3xl mx-auto">
                    <h2 className="text-5xl md:text-7xl font-light mb-8 text-white">Domina tu <span className="font-semibold text-aura-accent">caos</span>.</h2>
                    <p className="text-xl text-gray-400 mb-12">Únete a los profesionales que han dejado atrás la sobrecarga mental.</p>
                    <button
                        onClick={handleLogin}
                        className="group relative inline-flex items-center gap-3 px-12 py-6 bg-aura-accent text-aura-black rounded-full font-bold text-2xl shadow-[0_0_40px_rgba(212,225,87,0.2)] hover:shadow-[0_0_60px_rgba(212,225,87,0.4)] hover:scale-105 transition-all duration-300"
                    >
                        <span>Crear cuenta gratuita</span>
                        <ArrowRight size={28} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="mt-6 text-sm text-gray-600">No requiere tarjeta de crédito • Cancelación en cualquier momento</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 text-center text-gray-500 text-sm bg-black">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                        <img src={logo} className="w-6 h-6" style={{ mixBlendMode: 'lighten' }} alt="logo" />
                        <span className="font-bold">Aura Inc.</span>
                    </div>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-aura-accent transition-colors">Twitter</a>
                        <a href="#" className="hover:text-aura-accent transition-colors">GitHub</a>
                        <a href="#" className="hover:text-aura-accent transition-colors">Discord</a>
                        <a href="#" className="hover:text-aura-accent transition-colors">LinkedIn</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
