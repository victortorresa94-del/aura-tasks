import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    query,
    where,
    Timestamp,
    orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Habit, Routine, RoutineSession, HabitLog } from '../types/habits';

// Helper para convertir fechas de Firestore
const convertDates = (doc: any) => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        archivedAt: data.archivedAt
    };
};

export const habitService = {
    // --- HÁBITOS ---

    async createHabit(userId: string, data: Omit<Habit, 'id' | 'createdAt' | 'status' | 'userId'>) {
        const habitsRef = collection(db, 'habits');
        const newHabit = {
            ...data,
            userId,
            status: 'active',
            createdAt: Timestamp.now(),
        };
        const docRef = await addDoc(habitsRef, newHabit);
        return { id: docRef.id, ...newHabit };
    },

    async getUserHabits(userId: string) {
        const q = query(collection(db, 'habits'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(convertDates) as Habit[];
    },

    async updateHabit(habitId: string, data: Partial<Habit>) {
        const habitRef = doc(db, 'habits', habitId);
        await updateDoc(habitRef, data);
    },

    async archiveHabit(habitId: string) {
        const habitRef = doc(db, 'habits', habitId);
        await updateDoc(habitRef, {
            status: 'archived',
            archivedAt: Timestamp.now()
        });
    },

    // --- REGISTRO DE HÁBITOS ---

    async logHabit(userId: string, habitId: string, note?: string) {
        const logsRef = collection(db, 'habit_logs');
        const newLog = {
            userId,
            habitId,
            completedAt: Timestamp.now(),
            note: note || null
        };
        await addDoc(logsRef, newLog);
    },

    // --- RUTINAS ---

    async createRoutine(userId: string, data: Omit<Routine, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) {
        const routinesRef = collection(db, 'routines');
        const newRoutine = {
            ...data,
            userId,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };
        const docRef = await addDoc(routinesRef, newRoutine);
        return { id: docRef.id, ...newRoutine };
    },

    async getUserRoutines(userId: string) {
        const q = query(collection(db, 'routines'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(convertDates) as Routine[];
    },

    async updateRoutine(routineId: string, data: Partial<Routine>) {
        const routineRef = doc(db, 'routines', routineId);
        await updateDoc(routineRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
    },

    // --- SESIONES DE RUTINA ---

    async startRoutineSession(userId: string, routineId: string, routineName: string) {
        const sessionsRef = collection(db, 'routine_sessions');
        const newSession = {
            userId,
            routineId,
            routineName,
            status: 'started', // Inicialmente started, luego completed/partial
            startedAt: Timestamp.now(),
            completedSteps: []
        };
        const docRef = await addDoc(sessionsRef, newSession);
        return docRef.id;
    },

    async completeRoutineSession(sessionId: string, status: 'completed' | 'partial' | 'abandoned', completedSteps: string[], notes?: string) {
        const sessionRef = doc(db, 'routine_sessions', sessionId);
        await updateDoc(sessionRef, {
            status,
            endedAt: Timestamp.now(),
            completedSteps,
            notes: notes || null
        });
    }
};
