import { describe, it, expect } from 'vitest';
import { calculateSrsDateShifts } from '../srsDateShift';
import { Todo } from '../../types';

describe('calculateSrsDateShifts', () => {
    const createTodo = (id: string, dueDate: Date, groupId: string): Todo => ({
        id,
        title: `Task ${id}`,
        completed: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        dueDate,
        srsGroupId: groupId,
    });

    const groupId = 'group-1';

    it('日付を3日後ろにずらすと、後続のTodoも3日ずれる', () => {
        const allTodos = [
            createTodo('t1', new Date('2024-01-01'), groupId),
            createTodo('t2', new Date('2024-01-04'), groupId),
            createTodo('t3', new Date('2024-01-08'), groupId),
        ];

        const shifts = calculateSrsDateShifts(
            't1',
            new Date('2024-01-01'),
            new Date('2024-01-04'), // +3日
            groupId,
            allTodos
        );

        expect(shifts).toHaveLength(2);
        expect(shifts.find(s => s.id === 't2')?.newDueDate.toISOString()).toContain('2024-01-07');
        expect(shifts.find(s => s.id === 't3')?.newDueDate.toISOString()).toContain('2024-01-11');
    });

    it('日付を2日前にずらすと、後続のTodoも2日前にずれる', () => {
        const allTodos = [
            createTodo('t1', new Date('2024-01-05'), groupId),
            createTodo('t2', new Date('2024-01-08'), groupId),
            createTodo('t3', new Date('2024-01-15'), groupId),
        ];

        const shifts = calculateSrsDateShifts(
            't1',
            new Date('2024-01-05'),
            new Date('2024-01-03'), // -2日
            groupId,
            allTodos
        );

        expect(shifts).toHaveLength(2);
        expect(shifts.find(s => s.id === 't2')?.newDueDate.toISOString()).toContain('2024-01-06');
        expect(shifts.find(s => s.id === 't3')?.newDueDate.toISOString()).toContain('2024-01-13');
    });

    it('ずらしたTodo自体は結果に含まれない', () => {
        const allTodos = [
            createTodo('t1', new Date('2024-01-01'), groupId),
            createTodo('t2', new Date('2024-01-04'), groupId),
        ];

        const shifts = calculateSrsDateShifts(
            't1',
            new Date('2024-01-01'),
            new Date('2024-01-03'),
            groupId,
            allTodos
        );

        expect(shifts.find(s => s.id === 't1')).toBeUndefined();
    });

    it('ずらしたTodoより前の日付のTodoは影響を受けない', () => {
        const allTodos = [
            createTodo('t-before', new Date('2024-01-01'), groupId), // 元の日付より前
            createTodo('t1', new Date('2024-01-05'), groupId),
            createTodo('t-after', new Date('2024-01-10'), groupId),
        ];

        const shifts = calculateSrsDateShifts(
            't1',
            new Date('2024-01-05'),
            new Date('2024-01-08'), // +3日
            groupId,
            allTodos
        );

        expect(shifts).toHaveLength(1);
        expect(shifts[0].id).toBe('t-after');
    });

    it('日付差が0の場合、空配列を返す', () => {
        const allTodos = [
            createTodo('t1', new Date('2024-01-01'), groupId),
            createTodo('t2', new Date('2024-01-04'), groupId),
        ];

        const shifts = calculateSrsDateShifts(
            't1',
            new Date('2024-01-01'),
            new Date('2024-01-01'), // 同じ日付
            groupId,
            allTodos
        );

        expect(shifts).toEqual([]);
    });

    it('後続TodoにdueDateがないものはスキップされる', () => {
        const todoNoDueDate: Todo = {
            id: 't-no-date',
            title: 'No Date',
            completed: false,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            srsGroupId: groupId,
            // dueDate なし
        };

        const allTodos = [
            createTodo('t1', new Date('2024-01-01'), groupId),
            todoNoDueDate,
            createTodo('t3', new Date('2024-01-08'), groupId),
        ];

        const shifts = calculateSrsDateShifts(
            't1',
            new Date('2024-01-01'),
            new Date('2024-01-04'),
            groupId,
            allTodos
        );

        expect(shifts).toHaveLength(1);
        expect(shifts[0].id).toBe('t3');
    });

    it('groupIdが一致しないTodoは影響を受けない', () => {
        const allTodos = [
            createTodo('t1', new Date('2024-01-01'), groupId),
            createTodo('t-other', new Date('2024-01-05'), 'other-group'),
            createTodo('t2', new Date('2024-01-08'), groupId),
        ];

        const shifts = calculateSrsDateShifts(
            't1',
            new Date('2024-01-01'),
            new Date('2024-01-04'),
            groupId,
            allTodos
        );

        expect(shifts).toHaveLength(1);
        expect(shifts[0].id).toBe('t2');
    });
});
