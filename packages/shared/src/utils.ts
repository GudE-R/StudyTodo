import { Category } from "./types";

export function generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for environments where crypto.randomUUID is not available
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// カテゴリツリー構築ヘルパー
export const buildCategoryTree = (categories: Category[]) => {
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    // Deep copy to avoid mutating original objects from Dexie (which are frozen)
    const cats = categories.map(c => ({ ...c, children: [] as Category[] }));

    // First pass: map all categories
    cats.forEach(cat => {
        map.set(cat.id, cat);
    });

    // Second pass: link children to parents
    cats.forEach(cat => {
        if (cat.parentId) {
            const parent = map.get(cat.parentId);
            if (parent) {
                parent.children?.push(cat);
            }
        } else {
            roots.push(cat);
        }
    });

    return roots;
};
