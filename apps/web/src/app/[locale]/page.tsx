"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
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
import { LandingPage } from "@/components/landing/LandingPage";
import { FeedbackModal } from "@/components/feedback/FeedbackModal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { Todo, Feedback } from "@studytodo/shared";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { dataService } from "@/services/dataService";
import { useSync } from "@/hooks/useSync";
import { useAuth } from "@/contexts/AuthContext";


/**
 * ホーム画面（メインページ）
 * 
 * Dexie.js (IndexedDB) を使用してデータを永続化します。
 * PC最適化：3カラムレイアウト (30% - 30% - 40%)
 */

export default function Home() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
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
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isTodoDetailOpen, setIsTodoDetailOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Sync Logic
  const { isSyncing } = useSync();

  // Auth State
  const { user, loading: authLoading } = useAuth();

  // --- Handlers ---
  const handleDeleteTodo = async (todoId: string) => await dataService.deleteTodo(todoId);

  const handleCreateTodo = async (todoData: Omit<Todo, "id" | "createdAt" | "completed">) => {
    // Check for Weekday Routine
    if (todoData.routineDays && todoData.routineDays.length > 0) {
      await dataService.addRoutineTodos({
        ...todoData,
        id: "", // Temporary, will be generated
        createdAt: new Date(),
        completed: false,
      }, todoData.routineDays);
      setIsTodoModalOpen(false);
      return;
    }

    // Check for SRS
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
  };

  const handleOpenTodoDetail = (todo: Todo) => {
    setSelectedTodo(todo);
    setIsTodoDetailOpen(true);
  };

  const handleToggleTodoComplete = async (todo: Todo) => {
    await dataService.updateTodo(todo.id, { completed: !todo.completed, updatedAt: new Date() });
  };

  const handleUpdateTodo = async (updatedTodo: Todo, options?: { applySrs?: boolean }) => {
    const { id, ...updates } = updatedTodo;
    await dataService.updateTodo(id, { ...updates, updatedAt: new Date() });

    // SRS Generation Check
    if (options?.applySrs && updatedTodo.srsInterval) {
      const profile = srsProfiles.find(p => p.name === updatedTodo.srsInterval);
      if (profile) {
        await dataService.applySrsToExistingTodo(updatedTodo, profile.intervals);
      }
    }

    setIsTodoDetailOpen(false);
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

  const handleFeedbackSubmit = async (feedback: Feedback) => {
    await dataService.addFeedback(feedback);
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
  const isAnyModalOpen = isTodoModalOpen || isTemplateModalOpen || isActivityModalOpen || isSettingsModalOpen || isGuideModalOpen || isTodoDetailOpen || isFeedbackModalOpen;

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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size={40} />
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading StudyTodo...</p>
      </div>
    );
  }

  // 初回アクセス判定: 未ログイン & データが空の場合にランディングページを表示
  // 認証ロード中は判定をスキップ（ちらつき防止）
  const isFirstTimeUser = !authLoading && !user && todos.length === 0 && sessions.length === 0;

  if (showWelcome && isFirstTimeUser) {
    return (
      <LandingPage
        onGetStarted={() => {
          router.push(`/${locale}/auth`);
        }}
        onLogin={() => {
          router.push(`/${locale}/auth`);
        }}
      />
    );
  }

  if (viewMode === "timer" && activeTodo) {
    return (
      <TimerView
        todo={activeTodo}
        onBack={handleBackToHome}
        onSaveSession={handleSaveSession}
        onCompleteTask={async () => {
          await dataService.updateTodo(activeTodo.id, { completed: true, updatedAt: new Date() });
          handleBackToHome();
        }}
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
          onGuideClick={() => setIsGuideModalOpen(true)}
          onFeedbackClick={() => setIsFeedbackModalOpen(true)}
          isSyncing={isSyncing}
        />

        {/* 
            Main Layout: 3-Columns Grid
            Left: Todo (30%)
            Center: Schedule (30%)
            Right: Calendar (40%)
         */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative z-0">

          {/* Left: Todo List (30%) */}
          <div className="w-[30%] h-full border-r border-border flex flex-col transition-colors duration-300">
            {/* Header for Todo */}
            <div className="px-3 py-2 bg-background border-b border-border transition-colors duration-300">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("todoList")}</h3>
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
          <div className="w-[30%] h-full border-r border-border bg-background flex flex-col transition-colors duration-300">
            {/* Header for Schedule */}
            <div className="px-3 py-2 bg-background border-b border-border transition-colors duration-300">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("schedule")}</h3>
            </div>
            <DaySchedule
              keptTime={keptTime}
              keptDate={keptDate}
              onTimeLongPress={handleTimeLongPress}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              todos={todos}
              categories={categoriesFlat}
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
                todos={todos}
                categories={categoriesFlat}
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
          onOpenTodoDetail={handleOpenTodoDetail}
        />
        <TodoDetailModal
          isOpen={isTodoDetailOpen}
          onClose={() => setIsTodoDetailOpen(false)}
          todo={selectedTodo}
          categories={categories}
          srsProfiles={srsProfiles}
          onStartNow={handleStartFromDetail}
          onDelete={handleDeleteTodo}
          onUpdate={handleUpdateTodo}
          onRecord={handleRecordSession}
        />
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
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
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          onSubmit={handleFeedbackSubmit}
        />
      </div>
    </AppShell>
  );
}
