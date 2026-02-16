import { describe, it, expect } from 'vitest';
import { generateSRSTodos, generateSRSTodosForExisting } from '../srs';
import { Todo } from '../../types';

// Mock generateId to predict IDs in tests if needed, or just let it generate random ones.
// For testing logic, consistent IDs are better.
let idCounter = 0;
const mockGenerateId = () => `id-${++idCounter}`;

describe('SRS Logic', () => {
    const baseTodo: Todo = {
        id: 'temp-id',
        title: 'Test Task',
        completed: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
        dueDate: new Date('2024-01-01T00:00:00Z'),
    };

    const intervals = [1, 3, 7];

    it('generateSRSTodos should create base todo and review todos', () => {
        idCounter = 0;
        const result = generateSRSTodos(baseTodo, intervals, mockGenerateId);

        // Should return 1 base + 3 reviews = 4 todos
        expect(result).toHaveLength(4);

        const rootValues = result[0];
        expect(rootValues.id).toBe('id-1');
        expect(rootValues.srsGroupId).toBe('id-1');
        expect(rootValues.title).toBe('Test Task');

        const review1 = result[1];
        expect(review1.srsGroupId).toBe('id-1');
        expect(review1.title).toBe('Test Task (1回目)');
        // 2024-01-01 + 1 day = 2024-01-02
        expect(new Date(review1.dueDate!).toISOString()).toContain('2024-01-02');

        const review2 = result[2];
        expect(review2.title).toBe('Test Task (2回目)');
        // 2024-01-01 + 3 days = 2024-01-04
        expect(new Date(review2.dueDate!).toISOString()).toContain('2024-01-04');
    });

    it('generateSRSTodosForExisting should update base and create children', () => {
        idCounter = 0;
        const existingTodo: Todo = {
            ...baseTodo,
            id: 'existing-id'
        };

        const { updatedBase, children } = generateSRSTodosForExisting(existingTodo, intervals, mockGenerateId);

        expect(updatedBase.srsGroupId).toBe('existing-id');
        expect(children).toHaveLength(3);

        expect(children[0].srsGroupId).toBe('existing-id');
        expect(children[0].title).toBe('Test Task (1回目)');
    });

    it('generateSRSTodosForExisting should respect existing srsGroupId', () => {
        idCounter = 0;
        const existingTodo: Todo = {
            ...baseTodo,
            id: 'child-node',
            srsGroupId: 'root-id'
        };

        const { updatedBase, children } = generateSRSTodosForExisting(existingTodo, intervals, mockGenerateId);

        expect(updatedBase.srsGroupId).toBe('root-id');
        expect(children[0].srsGroupId).toBe('root-id');
    });

    it('空のintervals配列の場合、baseTodoのみ返す', () => {
        idCounter = 0;
        const result = generateSRSTodos(baseTodo, [], mockGenerateId);

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('Test Task');
        expect(result[0].srsGroupId).toBe(result[0].id);
    });

    it('dueDateがない場合、現在日付からの相対日付で生成される', () => {
        idCounter = 0;
        const noDueDateTodo: Todo = {
            ...baseTodo,
            dueDate: undefined,
        };

        const result = generateSRSTodos(noDueDateTodo, [1, 3], mockGenerateId);

        expect(result).toHaveLength(3); // 1 base + 2 reviews
        // review dates should exist
        expect(result[1].dueDate).toBeDefined();
        expect(result[2].dueDate).toBeDefined();
    });

    it('generateSRSTodosForExisting で空intervalsの場合、childrenは空', () => {
        idCounter = 0;
        const existingTodo: Todo = { ...baseTodo, id: 'existing-id' };

        const { updatedBase, children } = generateSRSTodosForExisting(existingTodo, [], mockGenerateId);

        expect(updatedBase.srsGroupId).toBe('existing-id');
        expect(children).toHaveLength(0);
    });

    it('reviewTodoのsrsProfileIdとsrsIntervalはundefined', () => {
        idCounter = 0;
        const todoWithProfile: Todo = {
            ...baseTodo,
            srsProfileId: 'profile-1',
            srsInterval: 'ebbinghaus',
        };

        const result = generateSRSTodos(todoWithProfile, [1], mockGenerateId);

        expect(result).toHaveLength(2);
        // Review todo should NOT have profileId/interval
        expect(result[1].srsProfileId).toBeUndefined();
        expect(result[1].srsInterval).toBeUndefined();
    });
});
