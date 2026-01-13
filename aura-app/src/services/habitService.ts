import { habitsRepo, routinesRepo, routineSessionsRepo, habitLogsRepo } from '../firebase/repositories';
import { Habit, Routine } from '../types';

export const habitService = {
    // --- HÁBITOS ---

    async createHabit(userId: string, data: Omit<Habit, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) {
        return await habitsRepo.create(userId, data);
    },

    async getUserHabits(userId: string) {
        return await habitsRepo.getAll(userId);
    },

    async updateHabit(userId: string, habitId: string, data: Partial<Habit>) {
        await habitsRepo.update(userId, habitId, data);
    },

    async archiveHabit(userId: string, habitId: string) {
        await habitsRepo.update(userId, habitId, {
            status: 'archived',
            // archivedAt: Date.now() // If added to type
        });
    },

    // --- REGISTRO DE HÁBITOS ---

    async logHabit(userId: string, habitId: string, note?: string) {
        await habitLogsRepo.create(userId, {
            habitId,
            completedAt: Date.now(),
            note: note || undefined
        });
    },

    // --- RUTINAS ---

    async createRoutine(userId: string, data: Omit<Routine, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) {
        return await routinesRepo.create(userId, data);
    },

    async getUserRoutines(userId: string) {
        return await routinesRepo.getAll(userId);
    },

    async updateRoutine(userId: string, routineId: string, data: Partial<Routine>) {
        await routinesRepo.update(userId, routineId, data);
    },

    // --- SESIONES DE RUTINA ---

    async startRoutineSession(userId: string, routineId: string, routineName: string) {
        const session = await routineSessionsRepo.create(userId, {
            routineId,
            routineName,
            status: 'started',
            startedAt: Date.now(),
            completedSteps: []
            // createdAt/ownerId handled by repo
        });
        return session.id;
    },

    async completeRoutineSession(userId: string, sessionId: string, status: 'completed' | 'partial' | 'abandoned', completedSteps: string[], notes?: string) {
        await routineSessionsRepo.update(userId, sessionId, {
            status,
            endedAt: Date.now(),
            completedSteps,
            notes: notes || undefined
        });
    }
};
