import { BaseRepository } from './base';
import {
    FirestoreTask, FirestoreNote, FirestoreProject, FirestoreContact, FirestoreFile, FirestoreView, FirestoreStatus,
    FirestoreTab, FirestoreTransaction, FirestoreHabit, FirestoreChatSession,
    FirestoreSubscription, FirestoreRecurringExpense, FirestoreRoutine, FirestoreRoutineSession,
    FirestoreHabitLog
} from '../../types';

export const tasksRepo = new BaseRepository<FirestoreTask>('tasks');
export const notesRepo = new BaseRepository<FirestoreNote>('notes');
export const projectsRepo = new BaseRepository<FirestoreProject>('projects');
export const contactsRepo = new BaseRepository<FirestoreContact>('contacts');
export const filesRepo = new BaseRepository<FirestoreFile>('files');
export const customViewsRepo = new BaseRepository<FirestoreView>('views');
export const statusesRepo = new BaseRepository<FirestoreStatus>('statuses');
export const tabsRepo = new BaseRepository<FirestoreTab>('tabs');
export const financeRepo = new BaseRepository<FirestoreTransaction>('transactions');
export const habitsRepo = new BaseRepository<FirestoreHabit>('habits');
export const chatSessionsRepo = new BaseRepository<FirestoreChatSession>('chat_sessions');
export const subscriptionsRepo = new BaseRepository<FirestoreSubscription>('subscriptions');
export const recurringExpensesRepo = new BaseRepository<FirestoreRecurringExpense>('recurring_expenses');
export const routinesRepo = new BaseRepository<FirestoreRoutine>('routines');
export const routineSessionsRepo = new BaseRepository<FirestoreRoutineSession>('routine_sessions');
export const habitLogsRepo = new BaseRepository<FirestoreHabitLog>('habit_logs');
