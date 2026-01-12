import { Timestamp } from 'firebase/firestore';

// --- HÁBITOS ---

export type HabitContext = 'mañana' | 'tarde' | 'noche' | 'cuerpo' | 'mente' | 'trabajo' | 'otro';

export interface Habit {
    id: string;
    userId: string;
    name: string;
    intention?: string;
    // Ritmo en lenguaje humano (ej: "3 veces por semana")
    rhythm?: string;
    context: HabitContext;
    emoji?: string; // Nuevo: Emoji visual
    status: 'active' | 'archived';
    createdAt: Timestamp;
    archivedAt?: Timestamp;
    tags?: string[];
    // Opcional: Relación con rutinas
    linkedRoutineIds?: string[];
}

export interface HabitLog {
    id: string;
    habitId: string;
    userId: string;
    completedAt: Timestamp;
    note?: string; // Opcional: "Me sentí genial"
}

// --- RUTINAS ---

export type RoutineStepType = 'action' | 'break' | 'reflection';

export interface RoutineStep {
    id: string;
    name: string;
    type: RoutineStepType;
    durationMinutes?: number;
    description?: string;
    imageUrl?: string; // Icono o foto inspiradora
}

export interface Routine {
    id: string;
    userId: string;
    name: string;
    context: HabitContext;
    emoji?: string; // Nuevo: Emoji visual
    description?: string;
    steps: RoutineStep[];
    // Duración total estimada (calculada o manual)
    estimatedDurationMinutes: number;
    // Relación opcional con un hábito
    linkedHabitId?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface RoutineSession {
    id: string;
    userId: string;
    routineId: string;
    routineName: string; // Snapshot del nombre al momento de ejecutar
    status: 'completed' | 'partial' | 'abandoned';
    startedAt: Timestamp;
    endedAt?: Timestamp;
    completedSteps: string[]; // IDs de los pasos completados
    notes?: string;
}
