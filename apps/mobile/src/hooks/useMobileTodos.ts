import { useState, useCallback, useEffect } from "react";

import { Todo } from "@pomarc/shared";
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
        // No need to manually refresh, onDataChange will trigger it
    };

    const updateTodo = async (id: string, updates: Partial<Todo>) => {
        await repository.updateTodo(id, updates);
        // No need to manually refresh, onDataChange will trigger it
    };

    const deleteTodo = async (id: string) => {
        await repository.deleteTodo(id);
        // No need to manually refresh, onDataChange will trigger it
    };

    return {
        todos,
        loading,
        refreshTodos,
        addTodo,
        updateTodo,
        deleteTodo
    };
}
