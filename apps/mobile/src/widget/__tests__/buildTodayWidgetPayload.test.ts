import { describe, it, expect } from 'vitest';
import { Category, Todo } from '@studytodo/shared';
import { buildTodayWidgetPayload, WIDGET_MAX_ITEMS } from '../buildTodayWidgetPayload';

const labels = { title: 'Today', empty: 'All done', more: '+%d', openApp: 'Open app' };
const now = new Date(2026, 9, 20, 9, 0);

const createTodo = (id: string, overrides: Partial<Todo> = {}): Todo => ({
    id,
    title: `todo-${id}`,
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    dueDate: new Date(2026, 9, 20),
    ...overrides,
});

const category: Category = {
    id: 'c1',
    name: 'Math',
    level: 'large',
    color: '#3b82f6',
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('buildTodayWidgetPayload', () => {
    it('should split todos into today and tomorrow', () => {
        const todos = [
            createTodo('1'),
            createTodo('2', { dueDate: new Date(2026, 9, 21) }),
            createTodo('3', { dueDate: new Date(2026, 9, 22) }),
        ];
        const { days } = buildTodayWidgetPayload(todos, [], now, labels);
        expect(Object.keys(days)).toEqual(['2026-10-20', '2026-10-21']);
        expect(days['2026-10-20'].items.map(i => i.title)).toEqual(['todo-1']);
        expect(days['2026-10-21'].items.map(i => i.title)).toEqual(['todo-2']);
    });

    it('should exclude completed todos', () => {
        const todos = [createTodo('1', { completed: true }), createTodo('2')];
        const { days } = buildTodayWidgetPayload(todos, [], now, labels);
        expect(days['2026-10-20'].items.map(i => i.title)).toEqual(['todo-2']);
        expect(days['2026-10-20'].total).toBe(1);
    });

    it('should include undated todos on every day', () => {
        const todos = [createTodo('1', { dueDate: undefined })];
        const { days } = buildTodayWidgetPayload(todos, [], now, labels);
        expect(days['2026-10-20'].total).toBe(1);
        expect(days['2026-10-21'].total).toBe(1);
    });

    it('should accept ISO string dueDate', () => {
        const todos = [createTodo('1', { dueDate: new Date(2026, 9, 20, 15).toISOString() })];
        const { days } = buildTodayWidgetPayload(todos, [], now, labels);
        expect(days['2026-10-20'].total).toBe(1);
    });

    it('should sort timed todos first in ascending order', () => {
        const todos = [
            createTodo('a'),
            createTodo('b', { dueTime: '18:00' }),
            createTodo('c', { dueTime: '07:30' }),
        ];
        const { days } = buildTodayWidgetPayload(todos, [], now, labels);
        expect(days['2026-10-20'].items.map(i => i.title)).toEqual(['todo-c', 'todo-b', 'todo-a']);
        expect(days['2026-10-20'].items[0].time).toBe('07:30');
        expect(days['2026-10-20'].items[2].time).toBe('');
    });

    it('should cap items but keep the total count', () => {
        const todos = Array.from({ length: WIDGET_MAX_ITEMS + 3 }, (_, i) => createTodo(String(i)));
        const { days } = buildTodayWidgetPayload(todos, [], now, labels);
        expect(days['2026-10-20'].items).toHaveLength(WIDGET_MAX_ITEMS);
        expect(days['2026-10-20'].total).toBe(WIDGET_MAX_ITEMS + 3);
    });

    it('should resolve category colors', () => {
        const todos = [createTodo('1', { categoryId: 'c1' }), createTodo('2', { categoryId: 'missing' })];
        const { days } = buildTodayWidgetPayload(todos, [category], now, labels);
        expect(days['2026-10-20'].items.map(i => i.color)).toEqual(['#3b82f6', '']);
    });
});
