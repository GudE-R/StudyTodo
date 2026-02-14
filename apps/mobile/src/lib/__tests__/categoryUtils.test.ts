import { describe, it, expect } from 'vitest';
import { buildCategoryTree } from '../categoryUtils';
import { Category } from '@studytodo/shared';

const createCategory = (id: string, parentId?: string, name: string = "test"): Category => ({
    id,
    parentId,
    name,
    level: "large",
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
});

describe('buildCategoryTree', () => {
    it('should handle empty array', () => {
        const result = buildCategoryTree([]);
        expect(result).toEqual([]);
    });

    it('should return all items as roots if no parentIds', () => {
        const categories = [
            createCategory("1"),
            createCategory("2"),
        ];
        const result = buildCategoryTree(categories);
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe("1");
        expect(result[0].children).toEqual([]);
    });

    it('should nest children under parents', () => {
        const categories = [
            createCategory("parent1"),
            createCategory("child1", "parent1"),
        ];
        const result = buildCategoryTree(categories);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("parent1");
        expect(result[0].children).toHaveLength(1);
        expect(result[0].children![0].id).toBe("child1");
    });

    it('should handle multiple levels of nesting', () => {
        const categories = [
            createCategory("root"),
            createCategory("child", "root"),
            createCategory("grandchild", "child"),
        ];
        // Note: Map behavior ensures references are preserved
        const result = buildCategoryTree(categories);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("root");
        expect(result[0].children![0].id).toBe("child");
        expect(result[0].children![0].children![0].id).toBe("grandchild");
    });

    it('should treat orphans (parent not found) as roots', () => {
        const categories = [
            createCategory("child", "missing-parent"),
        ];
        const result = buildCategoryTree(categories);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("child");
    });
});

// --- Added tests for getDescendantIds and isCategoryMatch ---

import { getDescendantIds, isCategoryMatch } from '../categoryUtils';

const createCategoryForSearch = (id: string, parentId?: string): Category => ({
    id,
    name: `Category ${id}`,
    parentId,
    level: 'medium',
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
});

describe('categoryUtils extended', () => {
    const categories: Category[] = [
        createCategoryForSearch('A'),
        createCategoryForSearch('B', 'A'),
        createCategoryForSearch('C', 'A'),
        createCategoryForSearch('D', 'B'),
        createCategoryForSearch('E', 'B'),
        createCategoryForSearch('F', 'C'),
        createCategoryForSearch('G', 'C'),
        createCategoryForSearch('H'), // Independent
    ];

    describe('getDescendantIds', () => {
        it('should return only self for leaf node', () => {
            const result = getDescendantIds('D', categories);
            expect(result.size).toBe(1);
            expect(result.has('D')).toBe(true);
        });

        it('should return self and direct children', () => {
            const result = getDescendantIds('B', categories);
            expect(result.size).toBe(3); // B, D, E
            expect(result.has('B')).toBe(true);
            expect(result.has('D')).toBe(true);
            expect(result.has('E')).toBe(true);
        });

        it('should return self and all descendants (deep)', () => {
            const result = getDescendantIds('A', categories);
            expect(result.size).toBe(7); // A, B, C, D, E, F, G
            expect(result.has('A')).toBe(true);
            expect(result.has('B')).toBe(true);
            expect(result.has('C')).toBe(true);
            expect(result.has('D')).toBe(true);
            expect(result.has('E')).toBe(true);
            expect(result.has('F')).toBe(true);
            expect(result.has('G')).toBe(true);
            expect(result.has('H')).toBe(false);
        });

        it('should return only self if independent node', () => {
            const result = getDescendantIds('H', categories);
            expect(result.size).toBe(1);
            expect(result.has('H')).toBe(true);
        });
    });

    describe('isCategoryMatch', () => {
        it('should return true if filter is all', () => {
            expect(isCategoryMatch('A', 'all', categories)).toBe(true);
        });

        it('should return true if ids match', () => {
            expect(isCategoryMatch('A', 'A', categories)).toBe(true);
        });

        it('should return true if target is descendant of filter', () => {
            expect(isCategoryMatch('D', 'A', categories)).toBe(true);
            expect(isCategoryMatch('F', 'A', categories)).toBe(true);
            expect(isCategoryMatch('D', 'B', categories)).toBe(true);
        });

        it('should return false if target is NOT descendant of filter', () => {
            expect(isCategoryMatch('C', 'B', categories)).toBe(false);
            expect(isCategoryMatch('H', 'A', categories)).toBe(false);
            expect(isCategoryMatch('A', 'B', categories)).toBe(false);
        });
    });
});
