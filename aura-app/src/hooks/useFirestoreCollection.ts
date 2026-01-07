import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BaseRepository } from '../firebase/repositories/base';

import { BaseEntity } from '../types';

export function useFirestoreCollection<T extends BaseEntity>(
    repo: BaseRepository<T>,
    initialData: T[] = []
) {
    const { user } = useAuth();
    const [data, setData] = useState<T[]>(initialData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // If no user, reset to empty/initial (or keep previous if desired, but for segregation empty is safer)
        if (!user) {
            setData(initialData);
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const unsubscribe = repo.subscribe(user.uid, (items) => {
                setData(items);
                setLoading(false);
                setError(null);
            }, (err) => {
                console.error(`Error subscribing to collection:`, err);
                setError(err);
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (err) {
            console.error("Setup subscription error:", err);
            setError(err as Error);
            setLoading(false);
        }
    }, [user, repo]); // Repo typically stable, user changes on auth

    return { data, loading, error };
}
