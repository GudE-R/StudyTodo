import { describe, it, expect } from 'vitest';
import { generateId, buildCategoryTree, getDescendantIds, isCategoryMatch } from '../utils';
import { Category } from '../types';

describe('utils', () => {
    describe('generateId', () => {
        it('should generate a string ID', () => {
            const id = generateId();
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
        });

        it('should generate unique IDs', () => {
            const id1 = generateId();
            const id2 = generateId();
            expect(id1).not.toBe(id2);
        });
    });

    describe('buildCategoryTree', () => {
        it('should build a tree from a flat list of categories', () => {
            const categories: Category[] = [
                { id: '1', name: 'Parent', level: 'large', order: 1, createdAt: new Date(), updatedAt: new Date() },
                { id: '2', name: 'Child', parentId: '1', level: 'medium', order: 1, createdAt: new Date(), updatedAt: new Date() },
            ];

            const tree = buildCategoryTree(categories);

            expect(tree.length).toBe(1);
            expect(tree[0].id).toBe('1');
            expect(tree[0].children?.length).toBe(1);
            expect(tree[0].children?.[0].id).toBe('2');
        });

        it('should handle complex trees', () => {
            const categories: Category[] = [
                { id: '1', name: 'Root 1', level: 'large', order: 1, createdAt: new Date(), updatedAt: new Date() },
                { id: '2', name: 'Root 2', level: 'large', order: 2, createdAt: new Date(), updatedAt: new Date() },
                { id: '3', name: 'Child 1-1', parentId: '1', level: 'medium', order: 1, createdAt: new Date(), updatedAt: new Date() },
                { id: '4', name: 'Child 1-2', parentId: '1', level: 'medium', order: 2, createdAt: new Date(), updatedAt: new Date() },
                { id: '5', name: 'Child 1-1-1', parentId: '3', level: 'small', order: 1, createdAt: new Date(), updatedAt: new Date() },
            ];

            const tree = buildCategoryTree(categories);

            expect(tree.length).toBe(2);
            expect(tree.find(c => c.id === '1')?.children?.length).toBe(2);
            expect(tree.find(c => c.id === '1')?.children?.find(c => c.id === '3')?.children?.length).toBe(1);
        });
    });

    describe('getDescendantIds', () => {
        const categories: Category[] = [
            { id: '1', name: 'Root', level: 'large', order: 1, createdAt: new Date(), updatedAt: new Date() },
            { id: '2', name: 'Child', parentId: '1', level: 'medium', order: 1, createdAt: new Date(), updatedAt: new Date() },
            { id: '3', name: 'Grandchild', parentId: '2', level: 'small', order: 1, createdAt: new Date(), updatedAt: new Date() },
            { id: '4', name: 'Other', level: 'large', order: 2, createdAt: new Date(), updatedAt: new Date() },
        ];

        it('should include the category itself', () => {
            const ids = getDescendantIds('1', categories);
            expect(ids.has('1')).toBe(true);
        });

        it('should include direct children', () => {
            const ids = getDescendantIds('1', categories);
            expect(ids.has('2')).toBe(true);
        });

        it('should include deep descendants', () => {
            const ids = getDescendantIds('1', categories);
            expect(ids.has('3')).toBe(true);
        });

        it('should not include unrelated categories', () => {
            const ids = getDescendantIds('1', categories);
            expect(ids.has('4')).toBe(false);
        });

        it('should return only self for leaf nodes', () => {
            const ids = getDescendantIds('3', categories);
            expect(ids.size).toBe(1);
            expect(ids.has('3')).toBe(true);
        });
    });

    describe('isCategoryMatch', () => {
        const categories: Category[] = [
            { id: '1', name: 'Root', level: 'large', order: 1, createdAt: new Date(), updatedAt: new Date() },
            { id: '2', name: 'Child', parentId: '1', level: 'medium', order: 1, createdAt: new Date(), updatedAt: new Date() },
        ];

        it('should always match with "all" filter', () => {
            expect(isCategoryMatch('1', 'all', categories)).toBe(true);
            expect(isCategoryMatch(undefined, 'all', categories)).toBe(true);
        });

        it('should not match undefined category with non-all filter', () => {
            expect(isCategoryMatch(undefined, '1', categories)).toBe(false);
        });

        it('should match exact category', () => {
            expect(isCategoryMatch('1', '1', categories)).toBe(true);
        });

        it('should match descendant category', () => {
            expect(isCategoryMatch('2', '1', categories)).toBe(true);
        });

        it('should not match unrelated category', () => {
            expect(isCategoryMatch('1', '2', categories)).toBe(false);
        });
    });
});
