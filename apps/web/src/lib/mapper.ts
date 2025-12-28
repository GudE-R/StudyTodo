import { Todo, Session } from "@pomarc/shared";

/**
 * App uses camelCase, DB uses snake_case.
 * Supabase client might handle some, but explicit mapping is safer.
 */
export const mapper = {
    toSupabase: (entity: any, userId?: string, allowedFields?: string[]) => {
        const newObj: any = {};
        for (const key in entity) {
            // If allowedFields is provided, skip keys not in it
            if (allowedFields && !allowedFields.includes(key)) {
                continue;
            }

            // Skip Dexie internal keys if any, though usually none.
            // Convert to snake_case
            const newKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            let value = entity[key];

            // Date to ISO string
            if (value instanceof Date) {
                value = value.toISOString();
            }

            newObj[newKey] = value;
        }

        // Add user_id if provided (This relies on user_id NOT being in allowedFields check if allowedFields is STRICT local fields only)
        // Usually allowedFields includes ID etc. user_id is appended.
        if (userId) {
            newObj['user_id'] = userId;
        }

        return newObj;
    },

    fromSupabase: (entity: any) => {
        const newObj: any = {};
        for (const key in entity) {
            // Skip system fields not needed in local DB
            if (key === 'user_id') continue;

            const newKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            let value = entity[key];

            // Date conversion
            if ((newKey.endsWith('At') || newKey.endsWith('Date') || key === 'due_date') && typeof value === 'string' && value) {
                value = new Date(value);
            }

            newObj[newKey] = value;
        }
        return newObj;
    }
};
