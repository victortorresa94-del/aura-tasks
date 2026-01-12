import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipForward, CheckCircle2, RotateCcw } from 'lucide-react';
import { Routine, RoutineStep } from '../../types/habits';
import { habitService } from '../../services/habitService';
import { useAuth } from '../../contexts/AuthContext';

interface RoutinePlayerProps {
    routine: Routine;
    onFinish: () => void;
}

export const RoutinePlayer: React.FC<RoutinePlayerProps> = ({ routine, onFinish }) => {
    const { user } = useAuth();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false); // Empieza corriendo
    const [sessionId, setSessionId] = useState<string | null>(null);

    // States del timer
    const [stepTimeRemaining, setStepTimeRemaining] = useState(0);
    const [totalElapsed, setTotalElapsed] = useState(0);

    const currentStep = routine.steps[currentStepIndex];

    // Iniciar sesión al montar
    useEffect(() => {
        const initSession = async () => {
            if (user) {
                const id = await habitService.startRoutineSession(user.uid, routine.id, routine.name);
                setSessionId(id);
            }
        };
        initSession();

        // Set initial time
        if (routine.steps.length > 0) {
            setStepTimeRemaining((routine.steps[0].durationMinutes || 0) * 60);
        }
    }, []);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (!isPaused && currentStepIndex < routine.steps.length) {
            interval = setInterval(() => {
                setTotalElapsed(prev => prev + 1);
                setStepTimeRemaining(prev => Math.max(0, prev - 1));
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isPaused, currentStepIndex]);

    // Cambiar timer cuando cambia el paso
    useEffect(() => {
        if (currentStep) {
            setStepTimeRemaining((currentStep.durationMinutes || 0) * 60);
        }
    }, [currentStepIndex]);

    const handleNext = async () => {
        if (currentStepIndex < routine.steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            await finishRoutine();
        }
    };

    const finishRoutine = async () => {
        if (sessionId) {
            await habitService.completeRoutineSession(
                sessionId,
                'completed',
                routine.steps.map(s => s.id)
            );
        }
        onFinish();
    };

    const handleAbandon = async () => {
        if (confirm('¿Seguro que quieres abandonar la rutina?')) {
            if (sessionId) {
                await habitService.completeRoutineSession(
                    sessionId,
                    'abandoned',
                    routine.steps.slice(0, currentStepIndex).map(s => s.id)
                );
            }
            onFinish();
        }
    };

    const togglePause = () => setIsPaused(!isPaused);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!currentStep) return <div>Cargando...</div>;

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col text-white animate-fade-in">
            {/* Header Minimalista */}
            <div className="p-6 flex justify-between items-center">
                <div>
                    <h2 className="text-gray-400 text-sm tracking-widest uppercase mb-1">{routine.name}</h2>
                    <p className="font-bold">Paso {currentStepIndex + 1} de {routine.steps.length}</p>
                </div>
                <button onClick={handleAbandon} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Contenido Central */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 text-center space-y-8">
                <div className="w-full max-w-md space-y-6">
                    <div className="relative w-48 h-48 mx-auto flex items-center justify-center rounded-full border-4 border-aura-accent/20 bg-aura-accent/5">
                        <svg className="absolute inset-0 w-full h-full -rotate-90 stroke-current text-aura-accent" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="46" fill="none" strokeWidth="4" className="text-white/5 opacity-50" />
                            <circle
                                cx="50" cy="50" r="46" fill="none" strokeWidth="4"
                                strokeDasharray="289"
                                strokeDashoffset={289 - (289 * stepTimeRemaining) / ((currentStep.durationMinutes || 1) * 60)}
                                className="transition-all duration-1000 ease-linear"
                            />
                        </svg>
                        <div className="text-4xl font-bold font-mono">
                            {formatTime(stepTimeRemaining)}
                        </div>
                    </div>

                    <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${currentStep.type === 'break' ? 'bg-blue-500/20 text-blue-400' : 'bg-aura-accent/20 text-aura-accent'
                            }`}>
                            {currentStep.type === 'break' ? 'Descanso' : 'Acción'}
                        </span>
                        <h1 className="text-4xl font-bold leading-tight">{currentStep.name}</h1>
                        {currentStep.description && (
                            <p className="text-gray-400 mt-4 text-lg max-w-sm mx-auto">{currentStep.description}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Controles */}
            <div className="p-8 pb-12 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent">
                <div className="max-w-md mx-auto flex items-center justify-between gap-6">
                    <button
                        onClick={togglePause}
                        className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                    >
                        {isPaused ? <Play size={24} /> : <Pause size={24} />}
                    </button>

                    <button
                        onClick={handleNext}
                        className="flex-1 bg-aura-accent text-black h-20 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-white transition-all shadow-lg shadow-aura-accent/20"
                    >
                        {currentStepIndex === routine.steps.length - 1 ? (
                            <>
                                <CheckCircle2 size={24} /> Terminar Rutina
                            </>
                        ) : (
                            <>
                                Siguiente Paso <SkipForward size={24} />
                            </>
                        )}
                    </button>
                </div>
                <div className="text-center mt-6 text-gray-500 text-xs">
                    Tiempo total transcurrido: {formatTime(totalElapsed)}
                </div>
            </div>
        </div>
    );
};
