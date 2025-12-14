"use client";

import React, { useState } from "react";
// import { useLiveQuery } from "dexie-react-hooks"; // Removed
// import { db } from "@/lib/db"; // Removed
import { TimerView } from "@/components/timer/TimerView";
import { TodoList } from "@/components/home/TodoList";
import { DateBar } from "@/components/home/DateBar";
import { DaySchedule } from "@/components/home/DaySchedule";
import { CalendarPane } from "@/components/home/CalendarPane";
import { BottomActions } from "@/components/home/BottomActions";
import { TodoCreateModal } from "@/components/todo/TodoCreateModal";
import { TodoDetailModal } from "@/components/todo/TodoDetailModal";
import { TemplateModal } from "@/components/template/TemplateModal";
import { ActivityModal } from "@/components/activity/ActivityModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { UsageGuideModal } from "@/components/guide/UsageGuideModal";
import { Todo, buildCategoryTree } from "@pomarc/shared";
import { startOfDay, endOfDay } from "date-fns";
import { useTodos } from "@/hooks/domain/useTodos";
import { useCategories } from "@/hooks/domain/useCategories";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTodoCreateOpen, setIsTodoCreateOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Queries
  // Queries via Hooks
  const { todos: todayTodos, updateTodo } = useTodos(selectedDate);
  const { categories, categoryTree } = useCategories();

  const handleToggleTodo = async (id: string, completed: boolean) => {
    try {
      await updateTodo(id, { completed, updatedAt: new Date() });
    } catch (error) {
      console.error(error);
    }
  };

  const handleReorderTodos = (sourceIndex: number, destinationIndex: number) => {
    // Implement reorder logic if needed, for simplicity just logging or skipping
    console.log("Reorder not fully implemented in Dexie yet without 'order' field management");
  };

  return (
    <main className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Left Column: Timer & DateBar & TodoList */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4">
          <DateBar
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onSettingsClick={() => setIsSettingsOpen(true)}
          />  </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <TimerView />

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[300px] p-2">
            <h2 className="text-lg font-bold px-4 py-2 text-gray-700 dark:text-gray-200">Tasks</h2>
            <TodoList
              todos={todayTodos}
              onToggle={handleToggleTodo}
              onSelect={setSelectedTodo}
              onReorder={handleReorderTodos}
            />
            {todayTodos.length === 0 && (
              <div className="text-center text-gray-400 py-10">
                No tasks for this day.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Schedule & Calendar (Hidden on mobile usually, but keeping simple grid for now) */}
      <div className="w-[350px] border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-col hidden lg:flex">
        <div className="h-1/2 p-4 border-b border-gray-100 dark:border-gray-800">
          <CalendarPane selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>
        <div className="h-1/2 p-4">
          <DaySchedule selectedDate={selectedDate} />
        </div>
      </div>

      {/* Floating Action Button & Bottom Sheet Controls */}
      <BottomActions
        onOpenCategoryEditor={() => setIsTemplateOpen(true)}
        onOpenActivity={() => setIsActivityOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSRSEditor={() => setIsTemplateOpen(true)} // Consolidated in TemplateModal
      />

      {/* Modals */}
      {isTodoCreateOpen && (
        <TodoCreateModal
          onClose={() => setIsTodoCreateOpen(false)}
          categories={categories}
        />
      )}
      {selectedTodo && (
        <TodoDetailModal
          todo={selectedTodo}
          onClose={() => setSelectedTodo(null)}
        />
      )}

      {isTemplateOpen && <TemplateModal onClose={() => setIsTemplateOpen(false)} />}
      {isActivityOpen && <ActivityModal onClose={() => setIsActivityOpen(false)} />}
      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} onOpenGuide={() => setIsGuideOpen(true)} />}
      {isGuideOpen && <UsageGuideModal onClose={() => setIsGuideOpen(false)} />}

      {/* Quick Add Button (Floating if needed, or part of BottomActions) */}
      <button
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg z-40 transition-transform hover:scale-105"
        onClick={() => setIsTodoCreateOpen(true)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    </main>
  );
}
