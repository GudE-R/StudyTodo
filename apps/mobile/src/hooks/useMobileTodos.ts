import { useState, useCallback, useEffect } from "react";

import { Todo } from "@pomarc/shared";
import { addDays } from "date-fns";
import { generateId } from "../lib/utils";
import { useRepository } from "../providers/RepositoryProvider";
import { SQLiteRepository } from "../repositories/SQLiteRepository";

/**
 * モバイル用のTodo管理カスタムフック。
 * リポジトリ経由でSQLiteデータの読み書きを行い、結果をstateで管理します。
 * onDataChangeリスナーでリアルタイム更新にも対応。
 */
export function useMobileTodos() {
    const repository = useRepository() as SQLiteRepository;
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshTodos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await repository.getTodos();
            setTodos(data);
        } catch (error) {
            console.error('Error fetching todos:', error);
        } finally {
            setLoading(false);
        }
    }, [repository]);

    // Initial load + Subscribe to data changes for realtime updates
    useEffect(() => {
        refreshTodos();

        // Subscribe to repository changes to get realtime updates
        const unsubscribe = repository.onDataChange((table, type, data) => {
            if (table === 'todos') {
                console.log('[useMobileTodos] Data change detected, refreshing...', type);
                refreshTodos();
            }
        });

        return () => {
            unsubscribe();
        };
    }, [refreshTodos, repository]);

    const addTodo = async (todo: Todo) => {
        await repository.addTodo(todo);
    };

    const addSRSTodos = async (baseTodo: Todo, intervals: number[]) => {
        const baseId = generateId();
        const todoWithId: Todo = {
            ...baseTodo,
            id: baseId,
            srsGroupId: baseId,
            createdAt: new Date(),
            updatedAt: new Date(),
            completed: false,
        };
        const todosToAdd: Todo[] = [todoWithId];
        const baseDate = baseTodo.dueDate ? new Date(baseTodo.dueDate) : new Date();

        intervals.forEach((days, index) => {
            const reviewTodo: Todo = {
                ...baseTodo,
                id: generateId(),
                title: `${baseTodo.title} (${index + 1}回目)`,
                dueDate: addDays(baseDate, days),
                completed: false,
                updatedAt: new Date(),
                createdAt: new Date(),
                srsGroupId: baseId,
            };
            todosToAdd.push(reviewTodo);
        });

        await repository.addSRSTodos(todosToAdd);
    };

    const applySrsToExistingTodo = async (todo: Todo, intervals: number[]) => {
        const srsGroupId = todo.srsGroupId || todo.id;

        if (!todo.srsGroupId) {
            await repository.updateTodo(todo.id, { srsGroupId });
        }

        const baseDate = todo.dueDate ? new Date(todo.dueDate) : new Date();
        const todosToAdd: Todo[] = [];

        intervals.forEach((days, index) => {
            const reviewTodo: Todo = {
                ...todo,
                id: generateId(),
                title: `${todo.title} (${index + 1}回目)`,
                dueDate: addDays(baseDate, days),
                completed: false,
                updatedAt: new Date(),
                createdAt: new Date(),
                srsGroupId: srsGroupId,
                srsInterval: undefined,
                srsProfileId: undefined
            };
            todosToAdd.push(reviewTodo);
        });

        await repository.addSRSTodos(todosToAdd);
    };

    const addRoutineTodos = async (baseTodo: Todo, routineDays: number[]) => {
        const groupId = generateId();
        const now = new Date();
        const todosToAdd: Todo[] = [];

        for (let i = 0; i < 30; i++) {
            const date = addDays(now, i);
            const dayOfWeek = date.getDay();

            if (routineDays.includes(dayOfWeek)) {
                const routineTodo: Todo = {
                    ...baseTodo,
                    id: generateId(),
                    dueDate: date,
                    completed: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    srsGroupId: groupId,
                };
                if (todosToAdd.length === 0) {
                    routineTodo.id = groupId;
                }
                todosToAdd.push(routineTodo);
            }
        }

        if (todosToAdd.length > 0) {
            await repository.addSRSTodos(todosToAdd); // Using addSRSTodos for bulk add
        }
    };

    const updateTodo = async (id: string, updates: Partial<Todo>) => {
        await repository.updateTodo(id, updates);
    };

    const deleteTodo = async (id: string) => {
        await repository.deleteTodo(id);
    };

    return {
        todos,
        loading,
        refreshTodos,
        addTodo,
        addSRSTodos,
        applySrsToExistingTodo,
        addRoutineTodos,
        updateTodo,
        deleteTodo
    };
}
