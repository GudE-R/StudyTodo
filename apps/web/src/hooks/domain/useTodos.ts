"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useRepository } from "@/providers/RepositoryProvider";
import { Todo } from "@pomarc/shared";
import { startOfDay, endOfDay } from "date-fns";

export function useTodos(date?: Date) {
    const repository = useRepository();

    const todos = useLiveQuery(async () => {
        if (date) {
            return await db.todos
                .where("dueDate")
                .between(startOfDay(date), endOfDay(date), true, true)
                .toArray();
        }
        return await db.todos.toArray();
    }, [date]) || [];

    const addTodo = async (todo: Todo) => {
        await repository.addTodo(todo);
    };

    const updateTodo = async (id: string, updates: Partial<Todo>) => {
        await repository.updateTodo(id, updates);
    };

    const deleteTodo = async (id: string) => {
        await repository.deleteTodo(id);
    };

    return {
        todos,
        addTodo,
        updateTodo,
        deleteTodo
    };
}
