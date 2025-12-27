import { Todo, Session } from "@/types";

/**
 * App uses camelCase, DB uses snake_case.
 * Supabase client might handle some, but explicit mapping is safer.
 */

export const mapper = {
    toSupabase: (entity: any) => {
        const newObj: any = {};
        for (const key in entity) {
            const newKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            let value = entity[key];

            // Date to ISO string
            if (value instanceof Date) {
                value = value.toISOString();
            }

            newObj[newKey] = value;
        }
        return newObj;
    },

    fromSupabase: (entity: any) => {
        const newObj: any = {};
        for (const key in entity) {
            const newKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            let value = entity[key];

            // Basic heuristic for Dates: if key contains 'At' or 'Date' and value is string
            if ((newKey.endsWith('At') || newKey.endsWith('Date')) && typeof value === 'string') {
                value = new Date(value);
            }

            newObj[newKey] = value;
        }
        return newObj;
    }
};
