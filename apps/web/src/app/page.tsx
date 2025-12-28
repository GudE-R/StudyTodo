"use client";

import React, { useState, useEffect } from "react";
import { isSameDay } from "date-fns";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { generateId, buildCategoryTree } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { DateBar } from "@/components/home/DateBar";
import { TodoList } from "@/components/home/TodoList";
import { DaySchedule } from "@/components/home/DaySchedule";
import { CalendarPane } from "@/components/home/CalendarPane";
import { BottomActions } from "@/components/home/BottomActions";
import { TodoCreateModal } from "@/components/todo/TodoCreateModal";
import { TodoDetailModal } from "@/components/todo/TodoDetailModal";
import { TemplateModal } from "@/components/template/TemplateModal";
import { ActivityModal } from "@/components/activity/ActivityModal";
import { TimerView } from "@/components/timer/TimerView";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { UsageGuideModal } from "@/components/guide/UsageGuideModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { Todo } from "@pomarc/shared";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { dataService } from "@/services/dataService";
import { useSync } from "@/hooks/useSync";


/**
 * ホーム画面（メインページ）
 * 
 * Dexie.js (IndexedDB) を使用してデータを永続化します。
 * PC最適化：3カラムレイアウト (30% - 30% - 40%)
 */

export default function Home() {
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"home" | "timer">("home");
  const [activeTodo, setActiveTodo] = useState<Todo | null>(null);

  // DBからデータを取得
  const todos = useLiveQuery(() => db.todos.orderBy("createdAt").reverse().toArray()) || [];
  const categoriesFlat = useLiveQuery(() => db.categories.orderBy("order").toArray()) || [];
  const srsProfiles = useLiveQuery(() => db.srsProfiles.toArray()) || [];
  const sessions = useLiveQuery(() => db.sessions.orderBy("createdAt").reverse().toArray()) || [];

  const categories = buildCategoryTree(categoriesFlat);

  // 日付/時間キープ機能用の状態
  const [keptDate, setKeptDate] = useState<Date | null>(null);
  const [keptTime, setKeptTime] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isTodoDetailOpen, setIsTodoDetailOpen] = useState(false);

  // Sync Logic
  const { isSyncing } = useSync();

  // --- Handlers ---
  const handleDeleteTodo = async (todoId: string) => await dataService.deleteTodo(todoId);

  const handleCreateTodo = async (todoData: Omit<Todo, "id" | "createdAt" | "completed">) => {
    // Check for SRS
    if (todoData.srsInterval && srsProfiles) {
      const profile = srsProfiles.find(p => p.name === todoData.srsInterval);
      if (profile && profile.intervals && profile.intervals.length > 0) {
        await dataService.addSRSTodos({
          ...todoData,
          id: generateId(),
          createdAt: new Date(),
          completed: false,
        }, profile.intervals); // intervals number[]
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
  };

  const handleOpenTodoDetail = (todo: Todo) => {
    setSelectedTodo(todo);
    setIsTodoDetailOpen(true);
  };

  const handleToggleTodoComplete = async (todo: Todo) => {
    await dataService.updateTodo(todo.id, { completed: !todo.completed, updatedAt: new Date() });
  };

  const handleStartFromDetail = (todo: Todo) => {
    setActiveTodo(todo);
    setViewMode("timer");
    setIsTodoDetailOpen(false);
  };

  const handleReorderTodo = async (todoId: string, newIndex: number) => {
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
  };

  const handleStartNow = async (todoData: Omit<Todo, "id" | "createdAt" | "completed">) => {
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
  };

  const handleRecordTodo = async (todoData: Omit<Todo, "id" | "createdAt" | "completed">, duration: number) => {
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
  };

  const handleBackToHome = () => {
    setViewMode("home");
    setActiveTodo(null);
  };

  const handleSaveSession = async (sessionData: { todoId: string; todoTitle: string; duration: number; mode: string }) => {
    await dataService.addSession({
      id: generateId(),
      ...sessionData,
      createdAt: new Date(),
      mode: sessionData.mode as "pomodoro" | "countdown" | "stopwatch"
    });
  };

  const handleRecordSession = async (todo: Todo, duration: number) => {
    await dataService.addSession({
      id: generateId(),
      todoId: todo.id,
      todoTitle: todo.title,
      duration: duration,
      createdAt: new Date(),
      mode: "stopwatch", // logging manual time better fits stopwatch semantic
    });
  };

  const handleBulkDelete = async (ids: string[]) => {
    await Promise.all(ids.map(id => dataService.deleteTodo(id)));
  };

  const handleDateLongPress = (date: Date) => {
    if (keptDate && date.getTime() === keptDate.getTime()) {
      setKeptDate(null);
    } else {
      setKeptDate(date);
    }
  };

  const handleTimeLongPress = (date: Date, time: string) => {
    if (keptTime === time && keptDate && date.getTime() === keptDate.getTime()) {
      setKeptTime(null);
      setKeptDate(null);
    } else {
      setKeptTime(time);
      setKeptDate(date);
    }
  };

  const handleResetKeep = () => {
    setKeptDate(null);
    setKeptTime(null);
  };

  // Keyboard Shortcuts
  const isAnyModalOpen = isTodoModalOpen || isTemplateModalOpen || isActivityModalOpen || isSettingsModalOpen || isGuideModalOpen || isTodoDetailOpen;

  useKeyboardShortcuts({
    onNewTodo: () => {
      if (!isAnyModalOpen && viewMode === "home") {
        setIsTodoModalOpen(true);
      }
    },
    onCloseModal: () => {
      if (isAnyModalOpen) {
        setIsTodoModalOpen(false);
        setIsTemplateModalOpen(false);
        setIsActivityModalOpen(false);
        setIsSettingsModalOpen(false);
        setIsGuideModalOpen(false);
        setIsAuthModalOpen(false);
        setIsTodoDetailOpen(false);
      }
    }
  });

  if (!isClient) {
    return null;
  }

  if (viewMode === "timer" && activeTodo) {
    return (
      <TimerView
        todo={activeTodo}
        onBack={handleBackToHome}
        onSaveSession={handleSaveSession}
      />
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col h-full absolute inset-0 pb-20 overflow-hidden">
        {/* Header Area (Top) */}
        <DateBar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onSettingsClick={() => setIsSettingsModalOpen(true)}
        />

        {/* 
            Main Layout: 3-Columns Grid
            Left: Todo (30%)
            Center: Schedule (30%)
            Right: Calendar (40%)
         */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative z-0">

          {/* Left: Todo List (30%) */}
          <div className="w-[30%] h-full border-r border-gray-100 dark:border-gray-800 flex flex-col">
            {/* Header for Todo */}
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Todo List</h3>
            </div>
            <TodoList
              todos={todos.filter(t =>
                !t.completed &&
                (!t.dueDate || isSameDay(new Date(t.dueDate), selectedDate))
              )}
              categories={categories}
              onTodoClick={handleOpenTodoDetail}
              onToggleComplete={handleToggleTodoComplete}
              onReorder={handleReorderTodo}
              onStart={handleStartFromDetail}
            />
          </div>

          {/* Center: Day Schedule (30%) */}
          <div className="w-[30%] h-full border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 flex flex-col">
            {/* Header for Schedule */}
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Schedule</h3>
            </div>
            <DaySchedule
              keptTime={keptTime}
              keptDate={keptDate}
              onTimeLongPress={handleTimeLongPress}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              todos={todos}
              onTodoClick={handleOpenTodoDetail}
            />
          </div>

          {/* Right: Calendar & Analysis (40%) */}
          <div className="w-[40%] h-full bg-white dark:bg-gray-900 flex flex-col">
            <div className="flex-1 overflow-hidden relative">
              <CalendarPane
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                keptDate={keptDate}
                onDateLongPress={handleDateLongPress}
                sessions={sessions}
              />
            </div>
          </div>
        </div>

        {/* Floating Bottom Actions (Keep always visible, z-index managed) */}
        <div className="z-50 relative pointer-events-none">
          <div className="pointer-events-auto">
            <BottomActions
              onOpenTodoModal={() => setIsTodoModalOpen(true)}
              onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
              onOpenActivityModal={() => setIsActivityModalOpen(true)}
              isHighlighted={!!keptDate || !!keptTime}
              onResetKeep={handleResetKeep}
            />
          </div>
        </div>

        {/* Modals */}
        <TodoCreateModal
          isOpen={isTodoModalOpen}
          onClose={() => setIsTodoModalOpen(false)}
          onCreate={handleCreateTodo}
          onStartNow={handleStartNow}
          onRecord={handleRecordTodo}
          categories={categories}
          srsProfiles={srsProfiles}
          initialDate={keptDate}
          initialTime={keptTime}
        />
        <TemplateModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
        />
        <ActivityModal
          isOpen={isActivityModalOpen}
          onClose={() => setIsActivityModalOpen(false)}
          sessions={sessions}
          todos={todos}
          onDeleteTodo={handleDeleteTodo}
          onBulkDelete={handleBulkDelete}
          categories={categories}
        />
        <TodoDetailModal
          isOpen={isTodoDetailOpen}
          onClose={() => setIsTodoDetailOpen(false)}
          todo={selectedTodo}
          categories={categories}
          onStartNow={handleStartFromDetail}
          onDelete={handleDeleteTodo}
          onRecord={handleRecordSession}
        />
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onOpenGuide={() => setIsGuideModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
        <UsageGuideModal
          isOpen={isGuideModalOpen}
          onClose={() => setIsGuideModalOpen(false)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    </AppShell>
  );
}
