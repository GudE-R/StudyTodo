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
import { Todo, Category, SRSProfile } from "@/types";

/**
 * ホーム画面（メインページ）
 * 
 * Dexie.js (IndexedDB) を使用してデータを永続化します。
 */

// カテゴリツリー構築ヘルパーは src/lib/utils.ts に移動しました

export default function Home() {
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"home" | "timer">("home");
  const [activeTodo, setActiveTodo] = useState<Todo | null>(null);

  // DBからデータを取得 (Live Query)
  const todos = useLiveQuery(() => db.todos.orderBy("createdAt").reverse().toArray()) || [];
  const categoriesFlat = useLiveQuery(() => db.categories.orderBy("order").toArray()) || [];
  const srsProfiles = useLiveQuery(() => db.srsProfiles.toArray()) || [];
  const sessions = useLiveQuery(() => db.sessions.orderBy("createdAt").reverse().toArray()) || [];

  const categories = buildCategoryTree(categoriesFlat);

  // 日付キープ機能用の状態
  const [keptDate, setKeptDate] = useState<Date | null>(null);
  // 時間キープ機能用の状態
  const [keptTime, setKeptTime] = useState<string | null>(null);
  // 現在選択中の日付（カレンダー・スケジュール表示用）
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Hydration Error対策: クライアントサイドでのみレンダリング
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
    // アプリ起動時に確実に今日の日付を選択
    setSelectedDate(new Date());
  }, []);

  // アクティビティモーダルの状態
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  // 設定モーダルと使用ガイドの状態
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);


  // Todo詳細モーダルの状態
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isTodoDetailOpen, setIsTodoDetailOpen] = useState(false);

  const handleDeleteTodo = async (todoId: string) => {
    await db.todos.delete(todoId);
  };

  const handleCreateTodo = async (todoData: Omit<Todo, "id" | "createdAt" | "completed">) => {
    await db.todos.add({
      ...todoData,
      id: generateId(),
      createdAt: new Date(),
      completed: false,
    });
    setIsTodoModalOpen(false);
  };

  // Todo詳細を開く
  const handleOpenTodoDetail = (todo: Todo) => {
    setSelectedTodo(todo);
    setIsTodoDetailOpen(true);
  };

  // Todoの完了状態を切り替え
  const handleToggleTodoComplete = async (todo: Todo) => {
    await db.todos.update(todo.id, { completed: !todo.completed, updatedAt: new Date() });
  };

  // 詳細画面からタイマーを開始
  const handleStartFromDetail = (todo: Todo) => {
    setActiveTodo(todo);
    setViewMode("timer");
    setIsTodoDetailOpen(false);
  };

  // Todoの並び替え（ドラッグ&ドロップ）
  const handleReorderTodo = async (todoId: string, newIndex: number) => {
    // 現在表示中のtodosリストで並び替え
    const filteredTodos = todos.filter(t =>
      !t.completed &&
      (!t.dueDate || isSameDay(new Date(t.dueDate), selectedDate))
    );

    const oldIndex = filteredTodos.findIndex(t => t.id === todoId);
    if (oldIndex === -1) return;

    // 並び替え後の順序でcreatedAtを更新（簡易的な実装）
    // 本格的には orderフィールドを追加するのが望ましい
    const reorderedTodos = [...filteredTodos];
    const [movedTodo] = reorderedTodos.splice(oldIndex, 1);
    reorderedTodos.splice(newIndex, 0, movedTodo);

    // 並び替えた順に新しいタイムスタンプを設定
    const now = Date.now();
    for (let i = 0; i < reorderedTodos.length; i++) {
      await db.todos.update(reorderedTodos[i].id, {
        updatedAt: new Date(now - i * 1000) // 新しいものほど上に
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
    await db.todos.add(newTodo);
    setActiveTodo(newTodo);
    setViewMode("timer");
    setIsTodoModalOpen(false);
  };

  const handleRecordTodo = async (todoData: Omit<Todo, "id" | "createdAt" | "completed">, duration: number) => {
    const newTodo: Todo = {
      ...todoData,
      id: generateId(),
      createdAt: todoData.dueDate || new Date(),
      completed: true,
    };
    await db.todos.add(newTodo);

    // Create session record
    await db.sessions.add({
      id: generateId(),
      todoId: newTodo.id,
      todoTitle: newTodo.title,
      duration: duration,
      createdAt: newTodo.createdAt,
      mode: "pomodoro", // Default to pomodoro for manual record for now, or add mode to handleRecordTodo args
    });
    setIsTodoModalOpen(false);
  };

  const handleBackToHome = () => {
    setViewMode("home");
    setActiveTodo(null);
  };

  // セッション保存処理
  const handleSaveSession = async (sessionData: { todoId: string; todoTitle: string; duration: number; mode: string }) => {
    await db.sessions.add({
      id: generateId(),
      ...sessionData,
      createdAt: new Date(),
      mode: sessionData.mode as "pomodoro" | "countdown" | "stopwatch"
    });
  };

  // カレンダーの日付長押し時の処理
  const handleDateLongPress = (date: Date) => {
    if (keptDate && date.getTime() === keptDate.getTime()) {
      setKeptDate(null);
    } else {
      setKeptDate(date);
    }
  };

  // スケジュールの時間長押し時の処理
  const handleTimeLongPress = (date: Date, time: string) => {
    if (keptTime === time && keptDate && date.getTime() === keptDate.getTime()) {
      setKeptTime(null);
      setKeptDate(null);
    } else {
      setKeptTime(time);
      setKeptDate(date);
    }
  };

  // キープ状態のリセット
  const handleResetKeep = () => {
    setKeptDate(null);
    setKeptTime(null);
  };

  if (!isClient) {
    return null; // サーバーサイドでは何もレンダリングしない
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
      <div className="flex flex-col h-full absolute inset-0 pb-20">
        {/* Header Area */}
        <DateBar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onSettingsClick={() => setIsSettingsModalOpen(true)}
        />

        {/* Main Content Area (Split View) */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Column: Todo List */}
          <div className="w-1/2 h-full overflow-y-auto border-r border-gray-100 dark:border-gray-800">
            <TodoList
              todos={todos.filter(t =>
                !t.completed &&
                (!t.dueDate || isSameDay(new Date(t.dueDate), selectedDate))
              )}
              categories={categories}
              onTodoClick={handleOpenTodoDetail}
              onToggleComplete={handleToggleTodoComplete}
              onReorder={handleReorderTodo}
            />
          </div>

          {/* Right Column: Day Schedule */}
          <div className="w-1/2 h-full overflow-y-auto bg-gray-50/50 dark:bg-gray-900">
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
        </div>

        {/* Bottom Area: Calendar (Fixed Height) */}
        <div className="h-[30%] border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
          <CalendarPane
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            keptDate={keptDate}
            onDateLongPress={handleDateLongPress}
            sessions={sessions}
          />
        </div>

        {/* Floating Bottom Actions */}
        <BottomActions
          onOpenTodoModal={() => setIsTodoModalOpen(true)}
          onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
          onOpenActivityModal={() => setIsActivityModalOpen(true)}
          isHighlighted={!!keptDate || !!keptTime}
          onResetKeep={handleResetKeep}
        />

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
          categories={categories}
        />
        <TodoDetailModal
          isOpen={isTodoDetailOpen}
          onClose={() => setIsTodoDetailOpen(false)}
          todo={selectedTodo}
          categories={categories}
          onStartNow={handleStartFromDetail}
          onDelete={handleDeleteTodo}
        />
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onOpenGuide={() => setIsGuideModalOpen(true)}
        />
        <UsageGuideModal
          isOpen={isGuideModalOpen}
          onClose={() => setIsGuideModalOpen(false)}
        />
      </div>
    </AppShell>
  );
}
