import { useState, useCallback, useEffect } from "react";

import { Todo, generateSRSTodos, generateSRSTodosForExisting, generateRoutineTodos, calculateSrsDateShifts } from "@studytodo/shared";
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
                if (__DEV__) console.log('[useMobileTodos] Data change detected, refreshing...', type);
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
        const todosToAdd = generateSRSTodos(baseTodo, intervals, generateId);
        await repository.addSRSTodos(todosToAdd);
    };

    const applySrsToExistingTodo = async (todo: Todo, intervals: number[]) => {
        const { updatedBase, children } = generateSRSTodosForExisting(todo, intervals, generateId);

        if (updatedBase.srsGroupId !== todo.srsGroupId) {
            await repository.updateTodo(updatedBase.id, { srsGroupId: updatedBase.srsGroupId });
        }

        await repository.addSRSTodos(children);
    };


    const addRoutineTodos = async (baseTodo: Todo, routineDays: number[]) => {
        const todosToAdd = generateRoutineTodos(baseTodo, routineDays, generateId);
        if (todosToAdd.length > 0) {
            await repository.addSRSTodos(todosToAdd);
        }
    };

    const updateRoutine = async (baseTodo: Todo, routineDays: number[]) => {
        if (!baseTodo.srsGroupId) return; // Should have a group ID to be updated as a routine

        const groupId = baseTodo.srsGroupId;

        // 1. Delete existing routine todos
        await repository.deleteTodosByGroupId(groupId);

        // 2. Re-create new routine (reuse logic from addRoutineTodos but with specific ID handling if needed)
        // Note: addRoutineTodos generates a NEW groupId. For update, we want to KEEP the same groupId concept?
        // Actually, if we delete all old ones, we can just generate a fresh set. 
        // If we want to link them, we could reuse the ID, but generating a new group ID is cleaner to avoid conflicts.
        // However, the UI might expect the same ID. Let's stick to generating a new set, as "Update" here means "Replace Schedule".

        // But wait, addRoutineTodos creates a NEW group ID. 
        // Let's modify addRoutineTodos slightly or just copy the logic here to control the Group ID?
        // Let's just use addRoutineTodos. It will create a new group. That's fine as the old group is gone.

        await addRoutineTodos(baseTodo, routineDays);
    };

    const updateTodo = async (id: string, updates: Partial<Todo>) => {
        // Find current state before update
        const oldTodo = todos.find(t => t.id === id);

        // Optimistic update
        await repository.updateTodo(id, updates);

        // SRS Date Shift Logic (using shared pure function)
        if (oldTodo && updates.dueDate && oldTodo.dueDate && oldTodo.srsGroupId) {
            const groupTodos = todos.filter(t => t.srsGroupId === oldTodo.srsGroupId);
            const shifts = calculateSrsDateShifts(
                id,
                new Date(oldTodo.dueDate),
                new Date(updates.dueDate),
                oldTodo.srsGroupId,
                groupTodos
            );

            for (const shift of shifts) {
                await repository.updateTodo(shift.id, {
                    dueDate: shift.newDueDate,
                    updatedAt: new Date()
                });
            }
        }
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
        updateRoutine,
        updateTodo,
        deleteTodo
    };
}
