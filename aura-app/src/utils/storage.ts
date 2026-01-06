
export const storage = {
    get: <T>(key: string, defaultValue: T, oldKey?: string): T => {
        try {
            // 1. Try new key
            const stored = localStorage.getItem(key);
            if (stored) {
                return JSON.parse(stored);
            }

            // 2. Try old key migration if provided
            if (oldKey) {
                const oldStored = localStorage.getItem(oldKey);
                if (oldStored) {
                    const parsed = JSON.parse(oldStored);
                    // Save to new key
                    localStorage.setItem(key, JSON.stringify(parsed));
                    // Optional: Remove old key? Better to keep for safety for now or remove if sure.
                    // localStorage.removeItem(oldKey); 
                    return parsed;
                }
            }

            return defaultValue;
        } catch (e) {
            console.warn(`Error reading ${key} from storage`, e);
            return defaultValue;
        }
    },

    set: <T>(key: string, value: T): void => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error saving ${key} to storage`, e);
        }
    },

    // Generic migration helper
    // usage: migrateData('my_data_v1', (data) => { ...transform... });
    migrate: <T>(key: string, version: number, migrationFn: (data: any) => T) => {
        try {
            const currentVersionKey = `${key}_version`;
            const storedVersion = parseInt(localStorage.getItem(currentVersionKey) || '0');

            if (storedVersion < version) {
                const rawData = localStorage.getItem(key);
                if (rawData) {
                    const data = JSON.parse(rawData);
                    const migratedData = migrationFn(data);
                    localStorage.setItem(key, JSON.stringify(migratedData));
                    localStorage.setItem(currentVersionKey, version.toString());
                    console.log(`Migrated ${key} to version ${version}`);
                    return migratedData;
                }
            }
        } catch (e) {
            console.error(`Migration failed for ${key}`, e);
        }
    }
};
