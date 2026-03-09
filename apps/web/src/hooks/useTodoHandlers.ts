"use client";

import { useCallback } from "react";
import { isSameDay } from "date-fns";
import { generateId } from "@/lib/utils";
import { dataService } from "@/services/dataService";
import { Todo, SRSProfile, Feedback } from "@studytodo/shared";

interface UseTodoHandlersProps {
    todos: Todo[];
    srsProfiles: SRSProfile[];
    selectedDate: Date;
    setIsTodoModalOpen: (open: boolean) => void;
    setIsTodoDetailOpen: (open: boolean) => void;
    setActiveTodo: (todo: Todo | null) => void;
    setViewMode: (mode: "home" | "timer") => void;
}

export function useTodoHandlers({
    todos,
    srsProfiles,
    selectedDate,
    setIsTodoModalOpen,
    setIsTodoDetailOpen,
    setActiveTodo,
    setViewMode,
}: UseTodoHandlersProps) {

    const handleDeleteTodo = useCallback(
        async (todoId: string) => await dataService.deleteTodo(todoId),
        []
    );

    const handleCreateTodo = useCallback(async (todoData: Omit<Todo, "id" | "createdAt" | "completed">) => {
        if (todoData.routineDays && todoData.routineDays.length > 0) {
            await dataService.addRoutineTodos({
                ...todoData,
                id: "",
                createdAt: new Date(),
                completed: false,
            }, todoData.routineDays);
            setIsTodoModalOpen(false);
            return;
        }

        if (todoData.srsInterval && srsProfiles) {
            const profile = srsProfiles.find(p => p.name === todoData.srsInterval);
            if (profile && profile.intervals && profile.intervals.length > 0) {
                await dataService.addSRSTodos({
                    ...todoData,
                    id: generateId(),
                    createdAt: new Date(),
                    completed: false,
                }, profile.intervals);
                setIsTodoModalOpen(false);
                return;
            }
        }

        await dataService.addTodo({
            ...todoData,
            id: generateId(),
            createdAt: new Date(),
            completed: false,
        });
        setIsTodoModalOpen(false);
    }, [srsProfiles, setIsTodoModalOpen]);

    const handleToggleTodoComplete = useCallback(async (todo: Todo) => {
        await dataService.updateTodo(todo.id, { completed: !todo.completed, updatedAt: new Date() });
    }, []);

    const handleUpdateTodo = useCallback(async (updatedTodo: Todo, options?: { applySrs?: boolean }) => {
        const { id, ...updates } = updatedTodo;
        await dataService.updateTodo(id, { ...updates, updatedAt: new Date() });

        if (options?.applySrs && updatedTodo.srsInterval) {
            const profile = srsProfiles.find(p => p.name === updatedTodo.srsInterval);
            if (profile) {
                await dataService.applySrsToExistingTodo(updatedTodo, profile.intervals);
            }
        }

        setIsTodoDetailOpen(false);
    }, [srsProfiles, setIsTodoDetailOpen]);

    const handleStartFromDetail = useCallback((todo: Todo) => {
        setActiveTodo(todo);
        setViewMode("timer");
        setIsTodoDetailOpen(false);
    }, [setActiveTodo, setViewMode, setIsTodoDetailOpen]);

    const handleReorderTodo = useCallback(async (todoId: string, newIndex: number) => {
        const filteredTodos = todos.filter(t =>
            !t.completed &&
            (!t.dueDate || isSameDay(new Date(t.dueDate), selectedDate))
        );
        const oldIndex = filteredTodos.findIndex(t => t.id === todoId);
        if (oldIndex === -1) return;

        const reorderedTodos = [...filteredTodos];
        const [movedTodo] = reorderedTodos.splice(oldIndex, 1);
        reorderedTodos.splice(newIndex, 0, movedTodo);

        const now = Date.now();
        for (let i = 0; i < reorderedTodos.length; i++) {
            await dataService.updateTodo(reorderedTodos[i].id, {
                updatedAt: new Date(now - i * 1000)
            });
        }
    }, [todos, selectedDate]);

    const handleStartNow = useCallback(async (todoData: Omit<Todo, "id" | "createdAt" | "completed">) => {
        const newTodo: Todo = {
            ...todoData,
            id: generateId(),
            createdAt: new Date(),
            completed: false,
        };
        await dataService.addTodo(newTodo);
        setActiveTodo(newTodo);
        setViewMode("timer");
        setIsTodoModalOpen(false);
    }, [setActiveTodo, setViewMode, setIsTodoModalOpen]);

    const handleRecordTodo = useCallback(async (todoData: Omit<Todo, "id" | "createdAt" | "completed">, duration: number) => {
        const createdAt = todoData.dueDate ? new Date(todoData.dueDate) : new Date();
        const newTodo: Todo = {
            ...todoData,
            id: generateId(),
            createdAt: createdAt,
            completed: true,
        };
        await dataService.addTodo(newTodo);
        await dataService.addSession({
            id: generateId(),
            todoId: newTodo.id,
            todoTitle: newTodo.title,
            duration: duration,
            createdAt: createdAt,
            mode: "pomodoro",
        });
        setIsTodoModalOpen(false);
    }, [setIsTodoModalOpen]);

    const handleSaveSession = useCallback(async (sessionData: { todoId: string; todoTitle: string; duration: number; mode: string }) => {
        await dataService.addSession({
            id: generateId(),
            ...sessionData,
            createdAt: new Date(),
            mode: sessionData.mode as "pomodoro" | "countdown" | "stopwatch"
        });
    }, []);

    const handleRecordSession = useCallback(async (todo: Todo, duration: number) => {
        await dataService.addSession({
            id: generateId(),
            todoId: todo.id,
            todoTitle: todo.title,
            duration: duration,
            createdAt: new Date(),
            mode: "stopwatch",
        });
    }, []);

    const handleFeedbackSubmit = useCallback(async (feedback: Feedback) => {
        await dataService.addFeedback(feedback);
    }, []);

    const handleBulkDelete = useCallback(async (ids: string[]) => {
        await Promise.all(ids.map(id => dataService.deleteTodo(id)));
    }, []);

    const handleBackToHome = useCallback(() => {
        setViewMode("home");
        setActiveTodo(null);
    }, [setViewMode, setActiveTodo]);

    return {
        handleDeleteTodo,
        handleCreateTodo,
        handleToggleTodoComplete,
        handleUpdateTodo,
        handleStartFromDetail,
        handleReorderTodo,
        handleStartNow,
        handleRecordTodo,
        handleSaveSession,
        handleRecordSession,
        handleFeedbackSubmit,
        handleBulkDelete,
        handleBackToHome,
    };
}
