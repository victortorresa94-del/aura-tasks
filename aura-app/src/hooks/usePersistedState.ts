import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

export function usePersistedState<T>(key: string, initialValue: T, oldKey?: string) {
    const [state, setState] = useState<T>(() => {
        return storage.get<T>(key, initialValue, oldKey);
    });

    useEffect(() => {
        storage.set<T>(key, state);
    }, [key, state]);

    return [state, setState] as const;
}
