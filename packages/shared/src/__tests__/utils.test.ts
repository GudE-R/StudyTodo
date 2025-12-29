import { describe, it, expect } from 'vitest';
import { generateId, buildCategoryTree } from '../utils';
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
});
