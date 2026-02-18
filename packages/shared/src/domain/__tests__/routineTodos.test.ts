import { describe, it, expect, beforeEach } from 'vitest';
import { generateRoutineTodos } from '../routineTodos';
import { Todo } from '../../types';

let idCounter = 0;
const mockGenerateId = () => `routine-${++idCounter}`;

describe('generateRoutineTodos', () => {
    const baseTodo: Todo = {
        id: 'temp-id',
        title: 'Daily Study',
        completed: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    beforeEach(() => {
        idCounter = 0;
    });

    it('routineDaysが空の場合、空配列を返す', () => {
        const result = generateRoutineTodos(baseTodo, [], mockGenerateId);
        expect(result).toEqual([]);
    });

    it('指定された曜日のTodoを生成する', () => {
        // 月曜日のみ（dayOfWeek = 1）
        const result = generateRoutineTodos(baseTodo, [1], mockGenerateId, 7);

        // 7日間で月曜日は 0〜1 回
        expect(result.length).toBeGreaterThanOrEqual(0);
        expect(result.length).toBeLessThanOrEqual(2);

        // 全てのTodoが月曜日であること
        for (const todo of result) {
            expect(new Date(todo.dueDate!).getDay()).toBe(1);
        }
    });

    it('全曜日指定（0〜6）で、days日分のTodoが生成される', () => {
        const result = generateRoutineTodos(baseTodo, [0, 1, 2, 3, 4, 5, 6], mockGenerateId, 30);
        expect(result).toHaveLength(30);
    });

    it('groupIdが全Todoで一致する', () => {
        const result = generateRoutineTodos(baseTodo, [0, 1, 2, 3, 4, 5, 6], mockGenerateId, 7);

        expect(result.length).toBe(7);
        const groupId = result[0].srsGroupId;
        expect(groupId).toBeDefined();

        for (const todo of result) {
            expect(todo.srsGroupId).toBe(groupId);
        }
    });

    it('最初のTodoのIDがgroupIdと同じ', () => {
        const result = generateRoutineTodos(baseTodo, [0, 1, 2, 3, 4, 5, 6], mockGenerateId, 7);

        expect(result[0].id).toBe(result[0].srsGroupId);
    });

    it('2番目以降のTodoのIDはgroupIdと異なる', () => {
        const result = generateRoutineTodos(baseTodo, [0, 1, 2, 3, 4, 5, 6], mockGenerateId, 7);

        for (let i = 1; i < result.length; i++) {
            expect(result[i].id).not.toBe(result[i].srsGroupId);
        }
    });

    it('全てのTodoが未完了で生成される', () => {
        const completedBase: Todo = { ...baseTodo, completed: true };
        const result = generateRoutineTodos(completedBase, [0, 1, 2, 3, 4, 5, 6], mockGenerateId, 7);

        for (const todo of result) {
            expect(todo.completed).toBe(false);
        }
    });

    it('baseTodoのtitleが引き継がれる', () => {
        const result = generateRoutineTodos(baseTodo, [0, 1, 2, 3, 4, 5, 6], mockGenerateId, 7);

        for (const todo of result) {
            expect(todo.title).toBe('Daily Study');
        }
    });

    it('days=0 の場合、空配列を返す', () => {
        const result = generateRoutineTodos(baseTodo, [0, 1, 2, 3, 4, 5, 6], mockGenerateId, 0);
        expect(result).toEqual([]);
    });
});
