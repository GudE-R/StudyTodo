import { describe, it, expect } from 'vitest';
import { cn, generateId, buildCategoryTree } from '../utils';
import { Category } from '@studytodo/shared';

describe('cn (className merge)', () => {
    it('複数のクラスを結合すること', () => {
        const result = cn('px-4', 'py-2');
        expect(result).toContain('px-4');
        expect(result).toContain('py-2');
    });

    it('条件付きクラスを処理すること', () => {
        const isHidden = false;
        const result = cn('base', isHidden && 'hidden', 'visible');
        expect(result).toContain('base');
        expect(result).toContain('visible');
        expect(result).not.toContain('hidden');
    });

    it('Tailwind の競合クラスをマージすること', () => {
        // twMerge が px-4 を px-2 で上書き
        const result = cn('px-4', 'px-2');
        expect(result).toBe('px-2');
    });
});

describe('generateId', () => {
    it('文字列を返すこと', () => {
        const id = generateId();
        expect(typeof id).toBe('string');
    });

    it('UUID 形式のパターンに一致すること', () => {
        const id = generateId();
        // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('毎回異なる ID を生成すること', () => {
        const ids = new Set(Array.from({ length: 100 }, () => generateId()));
        expect(ids.size).toBe(100);
    });
});

describe('buildCategoryTree', () => {
    const now = new Date();

    const makeCategory = (overrides: Partial<Category> & { id: string; name: string }): Category => ({
        level: 'large',
        order: 0,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    });

    it('parentId なしのカテゴリがルートになること', () => {
        const categories: Category[] = [
            makeCategory({ id: 'c1', name: 'Math' }),
            makeCategory({ id: 'c2', name: 'Science' }),
        ];

        const tree = buildCategoryTree(categories);
        expect(tree).toHaveLength(2);
        expect(tree[0].name).toBe('Math');
        expect(tree[1].name).toBe('Science');
    });

    it('子カテゴリが親の children に配置されること', () => {
        const categories: Category[] = [
            makeCategory({ id: 'c1', name: 'Math' }),
            makeCategory({ id: 'c2', name: 'Algebra', parentId: 'c1', level: 'medium' }),
            makeCategory({ id: 'c3', name: 'Geometry', parentId: 'c1', level: 'medium' }),
        ];

        const tree = buildCategoryTree(categories);
        expect(tree).toHaveLength(1);
        expect(tree[0].children).toHaveLength(2);
        expect(tree[0].children![0].name).toBe('Algebra');
        expect(tree[0].children![1].name).toBe('Geometry');
    });

    it('3階層のネストが正しく構築されること', () => {
        const categories: Category[] = [
            makeCategory({ id: 'c1', name: 'Root' }),
            makeCategory({ id: 'c2', name: 'Mid', parentId: 'c1', level: 'medium' }),
            makeCategory({ id: 'c3', name: 'Leaf', parentId: 'c2', level: 'small' }),
        ];

        const tree = buildCategoryTree(categories);
        expect(tree).toHaveLength(1);
        expect(tree[0].children).toHaveLength(1);
        expect(tree[0].children![0].children).toHaveLength(1);
        expect(tree[0].children![0].children![0].name).toBe('Leaf');
    });

    it('元の配列をミューテートしないこと', () => {
        const categories: Category[] = [
            makeCategory({ id: 'c1', name: 'Math' }),
            makeCategory({ id: 'c2', name: 'Sub', parentId: 'c1', level: 'medium' }),
        ];

        const originalIds = categories.map(c => c.id);
        buildCategoryTree(categories);

        // Original array should be unchanged
        expect(categories.map(c => c.id)).toEqual(originalIds);
        expect(categories).toHaveLength(2);
    });

    it('空配列で空配列を返すこと', () => {
        const tree = buildCategoryTree([]);
        expect(tree).toEqual([]);
    });

    it('存在しない parentId を持つカテゴリが孤立すること', () => {
        const categories: Category[] = [
            makeCategory({ id: 'c1', name: 'Orphan', parentId: 'nonexistent', level: 'medium' }),
        ];

        const tree = buildCategoryTree(categories);
        // Cannot find parent → not added to any parent's children, not in roots
        expect(tree).toHaveLength(0);
    });
});
