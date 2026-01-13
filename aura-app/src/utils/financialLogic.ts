
import { Task, Subscription, RecurringExpense } from '../types';
import { tasksRepo } from '../firebase/repositories';

/**
 * Calculates the next occurrence date based on frequency and day/date.
 */
function getNextPaymentDate(frequency: string, payDay?: number, startDate?: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If we have a specific start/next date (like in Subscriptions), parse it
    if (startDate) {
        const date = new Date(startDate);
        // If it's in the past, move it forward based on frequency? 
        // For subscriptions, usually 'nextPaymentDate' is updated by the server or manually.
        // Assuming 'startDate' IS the target date.
        return startDate;
    }

    // For Recurring Expenses with just a day (e.g. rent on the 5th)
    if (payDay) {
        const currentMonthTarget = new Date(today.getFullYear(), today.getMonth(), payDay);

        // If today is before or exactly the pay day, that's the one (unless we want to strictly generate 'future' tasks?)
        // If I create a task for today (and it's not done), that's good.
        if (currentMonthTarget >= today) {
            return currentMonthTarget.toISOString().split('T')[0];
        }

        // Otherwise, next month
        const nextMonthTarget = new Date(today.getFullYear(), today.getMonth() + 1, payDay);
        return nextMonthTarget.toISOString().split('T')[0];
    }

    return today.toISOString().split('T')[0]; // Fallback
}

/**
 * Synchronizes financial items (Subscriptions, Recurring Expenses) to Tasks.
 * Ensures a task exists for the next payment date.
 */
export async function syncFinancialTasks(
    userId: string,
    tasks: Task[],
    subscriptions: Subscription[],
    recurringExpenses: RecurringExpense[]
) {
    const newTasks: Task[] = [];
    const generatedIds: string[] = [];

    // 1. Process Subscriptions
    subscriptions.forEach(sub => {
        if (sub.status === 'cancelled') return;
        if (!sub.nextPaymentDate) return;

        const targetDate = sub.nextPaymentDate;
        const title = `Pagar Suscripción: ${sub.name}`;

        // Check availability
        const exists = tasks.some(t =>
            t.date === targetDate &&
            (t.title === title || t.customValues?.['linkedFinancialId'] === sub.id)
        );

        if (!exists) {
            newTasks.push({
                id: Date.now().toString() + Math.random().toString().slice(2, 5),
                ownerId: userId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                title: title,
                date: targetDate,
                status: 'todo',
                priority: 'alta',
                type: 'payment',
                listId: '1', // Default list or specific 'Financial' list if exists
                tags: ['finanzas', 'suscripción'],
                amount: sub.amount,
                currency: sub.currency,
                customValues: {
                    linkedFinancialId: sub.id,
                    financialType: 'subscription'
                }
            });
        }
    });

    // 2. Process Recurring Expenses
    recurringExpenses.forEach(rec => {
        const targetDate = getNextPaymentDate(rec.frequency, rec.payDay);
        const title = `Pago Recurrente: ${rec.name}`;

        const exists = tasks.some(t =>
            t.date === targetDate &&
            (t.title === title || t.customValues?.['linkedFinancialId'] === rec.id)
        );

        if (!exists) {
            newTasks.push({
                id: Date.now().toString() + Math.random().toString().slice(2, 5),
                ownerId: userId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                title: title,
                date: targetDate,
                status: 'todo',
                priority: 'alta',
                type: 'payment',
                listId: '1',
                tags: ['finanzas', 'recurrente'],
                amount: rec.amount,
                // Assuming Currency is EUR or implicit
                customValues: {
                    linkedFinancialId: rec.id,
                    financialType: 'recurring_expense'
                }
            });
        }
    });

    // Batch Create
    if (newTasks.length > 0) {
        console.log(`Creating ${newTasks.length} financial tasks...`);
        // We use batchCreate from repository
        await tasksRepo.batchCreate(userId, newTasks);
    }
}
