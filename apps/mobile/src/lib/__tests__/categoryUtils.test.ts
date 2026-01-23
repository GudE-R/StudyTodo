import { describe, it, expect } from 'vitest';
import { buildCategoryTree } from '../categoryUtils';
import { Category } from '@pomarc/shared';

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
