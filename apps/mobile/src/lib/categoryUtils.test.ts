import { getDescendantIds, isCategoryMatch } from './categoryUtils';
import { Category } from '@studytodo/shared';

// Mock Category factory
const createCategory = (id: string, parentId?: string): Category => ({
    id,
    name: `Category ${id}`,
    parentId,
    level: 'medium',
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    // @ts-ignore
    children: []
});

describe('categoryUtils', () => {
    const categories: Category[] = [
        createCategory('A'),
        createCategory('B', 'A'),
        createCategory('C', 'A'),
        createCategory('D', 'B'),
        createCategory('E', 'B'),
        createCategory('F', 'C'),
        createCategory('G', 'C'),
        createCategory('H'), // Independent
    ];

    /**
     * Structure:
     * A
     * ├── B
     * │   ├── D
     * │   └── E
     * └── C
     *     ├── F
     *     └── G
     * H
     */

    describe('getDescendantIds', () => {
        test('should return only self for leaf node', () => {
            const result = getDescendantIds('D', categories);
            expect(result.size).toBe(1);
            expect(result.has('D')).toBe(true);
        });

        test('should return self and direct children', () => {
            const result = getDescendantIds('B', categories);
            expect(result.size).toBe(3); // B, D, E
            expect(result.has('B')).toBe(true);
            expect(result.has('D')).toBe(true);
            expect(result.has('E')).toBe(true);
        });

        test('should return self and all descendants (deep)', () => {
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

        test('should return only self if independent node', () => {
            const result = getDescendantIds('H', categories);
            expect(result.size).toBe(1);
            expect(result.has('H')).toBe(true);
        });
    });

    describe('isCategoryMatch', () => {
        test('should return true if filter is all', () => {
            expect(isCategoryMatch('A', 'all', categories)).toBe(true);
        });

        test('should return true if ids match', () => {
            expect(isCategoryMatch('A', 'A', categories)).toBe(true);
        });

        test('should return true if target is descendant of filter', () => {
            expect(isCategoryMatch('D', 'A', categories)).toBe(true); // D is child of B which is child of A
            expect(isCategoryMatch('F', 'A', categories)).toBe(true);
            expect(isCategoryMatch('D', 'B', categories)).toBe(true);
        });

        test('should return false if target is NOT descendant of filter', () => {
            expect(isCategoryMatch('C', 'B', categories)).toBe(false); // C is sibling of B (child of A)
            expect(isCategoryMatch('H', 'A', categories)).toBe(false);
            expect(isCategoryMatch('A', 'B', categories)).toBe(false); // A is parent of B
        });
    });
});
