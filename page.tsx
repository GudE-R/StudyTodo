"use client";

import React, { useState } from "react";
import { isSameDay } from "date-fns";
import { AppShell } from "@/components/layout/AppShell";
import { DateBar } from "@/components/home/DateBar";
import { TodoList } from "@/components/home/TodoList";
import { DaySchedule } from "@/components/home/DaySchedule";
import { CalendarPane } from "@/components/home/CalendarPane";
import { BottomActions } from "@/components/home/BottomActions";
import { TodoCreateModal } from "@/components/todo/TodoCreateModal";
import { TemplateModal } from "@/components/template/TemplateModal";
import { ActivityModal } from "@/components/activity/ActivityModal";
import { TimerView } from "@/components/timer/TimerView";
import { Todo, Category, SRSProfile } from "@/types";

/**
 * ホーム画面（メインページ）
 * 
 * 各コンポーネントを組み立て、ワイヤーフレーム通りのレイアウトを実現します。
 * AppShell内で絶対配置(absolute positioning)とFlexboxを組み合わせて
 * 画面サイズに応じたレスポンシブな配置を行います。
 */
// モックデータ
const INITIAL_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "学習",
    level: "large",
    children: [
      {
        id: "1-1",
        name: "数学",
        level: "medium",
        parentId: "1",
        children: [
          { id: "1-1-1", name: "青チャート", level: "small", parentId: "1-1" },
        ],
      },
      {
        id: "1-2",
        name: "英語",
        level: "medium",
        parentId: "1",
        children: [],
      },
    ],
  },
];

const INITIAL_SRS_PROFILES: SRSProfile[] = [
  {
    id: "default",
    name: "忘却曲線 (標準)",
    intervals: [1, 3, 7, 14, 30],
    isDefault: true,
  },
  {
    id: "short",
    name: "短期集中",
    intervals: [1, 2, 3, 5],
    isDefault: false,
  },
];

export default function Home() {
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [viewMode, setViewMode] = useState<"home" | "timer">("home");
  const [activeTodo, setActiveTodo] = useState<Todo | null>(null);

  // テンプレートデータ (本来はDB/LocalStorage等で永続化)
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [srsProfiles, setSrsProfiles] = useState<SRSProfile[]>(INITIAL_SRS_PROFILES);

  // 日付キープ機能用の状態
  const [keptDate, setKeptDate] = useState<Date | null>(null);
  // 時間キープ機能用の状態
  const [keptTime, setKeptTime] = useState<string | null>(null);
  // 現在選択中の日付（カレンダー・スケジュール表示用）
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // アクティビティモーダルの状態
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  // セッション（学習記録）の状態
  const [sessions, setSessions] = useState<any[]>([]); // TODO: Type definition

  const handleDeleteTodo = (todoId: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== todoId));
  };

  const handleCreateTodo = (todoData: Omit<Todo, "id" | "createdAt" | "completed">) => {
    const newTodo: Todo = {
      ...todoData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      completed: false,
    };
    setTodos((prev) => [newTodo, ...prev]);
    setIsTodoModalOpen(false);
  };

  const handleStartNow = (todoData: Omit<Todo, "id" | "createdAt" | "completed">) => {
    const newTodo: Todo = {
      ...todoData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      completed: false,
    };
    setTodos((prev) => [newTodo, ...prev]);
    setActiveTodo(newTodo);
    setViewMode("timer");
    setIsTodoModalOpen(false);
  };

  const handleRecordTodo = (todoData: Omit<Todo, "id" | "createdAt" | "completed">, duration: number) => {
    const newTodo: Todo = {
      ...todoData,
      id: crypto.randomUUID(),
      createdAt: todoData.dueDate || new Date(), // Use selected date if available, else now
      completed: true,
    };
    setTodos((prev) => [newTodo, ...prev]);

    // Create session record
    const newSession = {
      id: crypto.randomUUID(),
      todoId: newTodo.id,
      todoTitle: newTodo.title,
      duration: duration,
      createdAt: newTodo.createdAt, // Match todo date
      mode: "record", // New mode for manual recording
    };
    setSessions(prev => [newSession, ...prev]);
    setIsTodoModalOpen(false);
  };

  const handleBackToHome = () => {
    setViewMode("home");
    setActiveTodo(null);
  };

  // セッション保存処理
  const handleSaveSession = (sessionData: { todoId: string; todoTitle: string; duration: number; mode: string }) => {
    const newSession = {
      id: crypto.randomUUID(),
      ...sessionData,
      createdAt: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
  };

  // カレンダーの日付長押し時の処理
  const handleDateLongPress = (date: Date) => {
    // 既に選択されている日付を再度長押しした場合は解除、そうでなければ設定
    if (keptDate && date.getTime() === keptDate.getTime()) {
      setKeptDate(null);
    } else {
      setKeptDate(date);
    }
  };

  // スケジュールの時間長押し時の処理
  const handleTimeLongPress = (date: Date, time: string) => {
    // 既に選択されている時間を再度長押しした場合は解除
    // 日付も一致しているか確認
    if (keptTime === time && keptDate && date.getTime() === keptDate.getTime()) {
      setKeptTime(null);
      setKeptDate(null); // 時間解除時は日付も解除する（セットで扱うため）
    } else {
      setKeptTime(time);
      setKeptDate(date); // 押された日付をキープ
    }
  };

  // キープ状態のリセット
  const handleResetKeep = () => {
    setKeptDate(null);
    setKeptTime(null);
  };

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
        />

        {/* Main Content Area (Split View) */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Column: Todo List */}
          <div className="w-1/2 h-full overflow-y-auto border-r border-gray-100">
            <TodoList
              todos={todos.filter(t =>
                !t.completed &&
                (!t.dueDate || isSameDay(new Date(t.dueDate), selectedDate))
              )}
            />
          </div>

          {/* Right Column: Day Schedule */}
          <div className="w-1/2 h-full overflow-y-auto bg-gray-50/50">
            <DaySchedule
              keptTime={keptTime}
              keptDate={keptDate}
              onTimeLongPress={handleTimeLongPress}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              todos={todos}
            />
          </div>
        </div>

        {/* Bottom Area: Calendar (Fixed Height) */}
        <div className="h-[30%] border-t border-gray-200 bg-white z-10">
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
          categories={categories}
          onCategoriesChange={setCategories}
          srsProfiles={srsProfiles}
          onSrsProfilesChange={setSrsProfiles}
        />
        <ActivityModal
          isOpen={isActivityModalOpen}
          onClose={() => setIsActivityModalOpen(false)}
          sessions={sessions}
          todos={todos}
          onDeleteTodo={handleDeleteTodo}
          categories={categories}
        />
      </div>
    </AppShell>
  );
}
