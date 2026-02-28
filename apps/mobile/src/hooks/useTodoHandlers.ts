import { useState, useCallback } from 'react';
import { Todo, generateId } from '@studytodo/shared';
import { useMobileTodos } from './useMobileTodos';
import { useMobileSessions } from './useMobileSessions';
import { useMobileSRS } from './useMobileSRS';

/**
 * MainLayout_Safe / MainLayoutSimple 共通のTodoハンドラ
 * Keep State, モーダル表示制御, CRUD操作を統合
 */
export function useTodoHandlers() {
    const { addTodo, updateTodo, deleteTodo, applySrsToExistingTodo } = useMobileTodos();
    const { addSession } = useMobileSessions();
    const { profiles: srsProfiles } = useMobileSRS();

    // View mode
    const [viewMode, setViewMode] = useState<"home" | "timer">("home");
    const [activeTodo, setActiveTodo] = useState<Todo | null>(null);

    // Keep State
    const [keptDate, setKeptDate] = useState<Date | null>(null);
    const [keptTime, setKeptTime] = useState<string | null>(null);

    // Modal States
    const [isTodoModalVisible, setTodoModalVisible] = useState(false);
    const [isDetailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
    const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
    const [isTemplateModalVisible, setTemplateModalVisible] = useState(false);
    const [isActivityModalVisible, setActivityModalVisible] = useState(false);
    const [isFeedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [isGuideModalVisible, setGuideModalVisible] = useState(false);
    const [isMenuModalVisible, setMenuModalVisible] = useState(false);

    // --- Keep Handlers ---

    const handleDateLongPress = useCallback((date: Date) => {
        if (keptDate && date.getTime() === keptDate.getTime()) {
            setKeptDate(null);
        } else {
            setKeptDate(date);
        }
    }, [keptDate]);

    const handleTimeLongPress = useCallback((date: Date, time: string) => {
        if (keptTime === time && keptDate && date.getTime() === keptDate.getTime()) {
            setKeptTime(null);
            setKeptDate(null);
        } else {
            setKeptTime(time);
            setKeptDate(date);
        }
    }, [keptTime, keptDate]);

    const handleResetKeep = useCallback(() => {
        setKeptDate(null);
        setKeptTime(null);
    }, []);

    // --- Todo Handlers ---

    const handleStartNow = useCallback(async (todoData: Omit<Todo, "id" | "createdAt" | "completed">) => {
        const newTodo: Todo = {
            ...todoData,
            id: generateId(),
            createdAt: new Date(),
            completed: false,
        };
        await addTodo(newTodo);
        setActiveTodo(newTodo);
        setViewMode("timer");
        setTodoModalVisible(false);
    }, [addTodo]);

    const handleTodoPress = useCallback((todo: Todo) => {
        setSelectedTodo(todo);
        setDetailModalVisible(true);
    }, []);

    const handleTodoStartNow = useCallback((todo: Todo) => {
        setActiveTodo(todo);
        setViewMode("timer");
    }, []);

    const handleTodoUpdate = useCallback(async (todo: Todo, options?: { applySrs?: boolean }) => {
        await updateTodo(todo.id, todo);

        // SRS Generation Logic
        if (options?.applySrs && todo.srsInterval) {
            const profile = srsProfiles.find(p => p.name === todo.srsInterval);
            if (profile) {
                await applySrsToExistingTodo(todo, profile.intervals);
            }
        }
    }, [updateTodo, srsProfiles, applySrsToExistingTodo]);

    const handleTodoDelete = useCallback(async (todoId: string) => {
        await deleteTodo(todoId);
    }, [deleteTodo]);

    const handleTodoRecord = useCallback(async (todo: Todo, duration: number) => {
        await updateTodo(todo.id, { ...todo, completed: true });
        await addSession({
            id: generateId(),
            todoId: todo.id,
            todoTitle: todo.title,
            duration: duration,
            mode: 'pomodoro',
            createdAt: new Date(),
        });
    }, [updateTodo, addSession]);

    const handleTimerBack = useCallback(() => {
        setViewMode("home");
        setActiveTodo(null);
    }, []);

    const handleSaveSession = useCallback(async (data: { todoId: string; todoTitle: string; duration: number; mode: string }) => {
        await addSession({
            id: generateId(),
            todoId: data.todoId,
            todoTitle: data.todoTitle,
            duration: data.duration,
            mode: data.mode as "pomodoro" | "stopwatch" | "countdown",
            createdAt: new Date(),
        });
    }, [addSession]);

    const handleCompleteTask = useCallback(async () => {
        if (activeTodo) {
            await updateTodo(activeTodo.id, { ...activeTodo, completed: true });
        }
        setViewMode("home");
        setActiveTodo(null);
    }, [activeTodo, updateTodo]);

    return {
        // View mode
        viewMode, activeTodo,

        // Keep state
        keptDate, keptTime,

        // Modal state
        isTodoModalVisible, setTodoModalVisible,
        isDetailModalVisible, setDetailModalVisible,
        selectedTodo,
        isSettingsModalVisible, setSettingsModalVisible,
        isTemplateModalVisible, setTemplateModalVisible,
        isActivityModalVisible, setActivityModalVisible,
        isFeedbackModalVisible, setFeedbackModalVisible,
        isGuideModalVisible, setGuideModalVisible,
        isMenuModalVisible, setMenuModalVisible,

        // Keep handlers
        handleDateLongPress,
        handleTimeLongPress,
        handleResetKeep,

        // Todo handlers
        handleStartNow,
        handleTodoPress,
        handleTodoStartNow,
        handleTodoUpdate,
        handleTodoDelete,
        handleTodoRecord,

        // Timer handlers
        handleTimerBack,
        handleSaveSession,
        handleCompleteTask,
    };
}
