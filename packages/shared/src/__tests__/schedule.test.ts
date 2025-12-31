import { describe, it, expect } from 'vitest';
import { getTodoScheduleRange } from '../utils/schedule';
import { Todo } from '../types';

describe('getTodoScheduleRange', () => {
    const baseTodo: Todo = {
        id: '1',
        title: 'Test Todo',
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    it('should return null if no time is specified', () => {
        expect(getTodoScheduleRange(baseTodo)).toBeNull();
    });

    it('should use dueTime for start time', () => {
        const todo: Todo = {
            ...baseTodo,
            dueTime: '10:30',
        };
        const result = getTodoScheduleRange(todo);
        expect(result).toEqual({ start: 630, end: 660 }); // 10:30 + 30min default
    });

    it('should use endTime if specified', () => {
        const todo: Todo = {
            ...baseTodo,
            dueTime: '10:00',
            endTime: '11:00',
        };
        const result = getTodoScheduleRange(todo);
        expect(result).toEqual({ start: 600, end: 660 }); // 10:00 -> 11:00 (60min)
    });

    it('should handle endTime crossing midnight', () => {
        const todo: Todo = {
            ...baseTodo,
            dueTime: '23:00',
            endTime: '01:00',
        };
        const result = getTodoScheduleRange(todo);
        expect(result).toEqual({ start: 1380, end: 1500 }); // 23:00 -> 25:00 (120min)
    });

    it('should use estimatedDuration if endTime is not specified', () => {
        const todo: Todo = {
            ...baseTodo,
            dueTime: '10:00',
            estimatedDuration: 45,
        };
        const result = getTodoScheduleRange(todo);
        expect(result).toEqual({ start: 600, end: 645 }); // 10:00 + 45min
    });

    it('should fall back to 30 mins if only start time is present', () => {
        const todo: Todo = {
            ...baseTodo,
            dueTime: '10:00',
        };
        const result = getTodoScheduleRange(todo);
        expect(result).toEqual({ start: 600, end: 630 }); // 10:00 + 30min
    });

    it('should prioritize endTime over estimatedDuration', () => {
        const todo: Todo = {
            ...baseTodo,
            dueTime: '10:00',
            endTime: '12:00',
            estimatedDuration: 45,
        };
        const result = getTodoScheduleRange(todo);
        expect(result).toEqual({ start: 600, end: 720 }); // 10:00 -> 12:00 (120min), duration 45 ignored for end calc
    });
});
