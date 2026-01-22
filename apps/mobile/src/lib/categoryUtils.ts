import { Category } from '@pomarc/shared';

/**
 * フラットなカテゴリ配列をツリー構造に変換します。
 * parentId を使って親子関係を構築し、ルートカテゴリの配列を返します。
 * 
 * @param categories - フラットなカテゴリ配列
 * @returns ツリー構造のカテゴリ配列（ルートのみ）
 */
export const buildCategoryTree = (categories: Category[]): Category[] => {
    const map = new Map<string, Category>();
    categories.forEach(c => map.set(c.id, { ...c, children: [] }));

    const roots: Category[] = [];
    map.forEach(c => {
        if (c.parentId && map.has(c.parentId)) {
            map.get(c.parentId)?.children?.push(c);
        } else {
            roots.push(c);
        }
    });

    return roots;
};
