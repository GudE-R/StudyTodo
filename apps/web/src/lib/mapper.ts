import { Todo, Session, Category, SRSProfile } from "@pomarc/shared";

const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const toCamelCase = (str: string) => str.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));

export const mapper = {
    toSupabase: (entity: any) => {
        const newObj: any = {};
        for (const key in entity) {
            if (Object.prototype.hasOwnProperty.call(entity, key)) {
                let value = entity[key];
                const newKey = toSnakeCase(key);

                if (value instanceof Date) {
                    value = value.toISOString();
                }
                newObj[newKey] = value;
            }
        }
        return newObj;
    },

    fromSupabase: (entity: any) => {
        const newObj: any = {};
        for (const key in entity) {
            if (Object.prototype.hasOwnProperty.call(entity, key)) {
                let value = entity[key];
                const newKey = toCamelCase(key);

                // Heuristic for Dates
                if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        value = date;
                    }
                }
                newObj[newKey] = value;
            }
        }
        return newObj;
    }
};
