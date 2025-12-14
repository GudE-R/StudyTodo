import { useState, useCallback } from "react";

import { Todo } from "@pomarc/shared";
import { useRepository } from "../providers/RepositoryProvider";

export function useMobileTodos() {
    const repository = useRepository();
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshTodos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await repository.getTodos();
            setTodos(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [repository]);

    // Initial load
    // In a real app with navigation, useFocusEffect is better to auto-refresh on screen focus
    // For now, useEffect is fine for single screen
    /* 
    useEffect(() => {
        refreshTodos();
    }, [refreshTodos]);
    */

    const addTodo = async (todo: Todo) => {
        await repository.addTodo(todo);
        await refreshTodos();
    };

    const updateTodo = async (id: string, updates: Partial<Todo>) => {
        await repository.updateTodo(id, updates);
        await refreshTodos();
    };

    const deleteTodo = async (id: string) => {
        await repository.deleteTodo(id);
        await refreshTodos();
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
