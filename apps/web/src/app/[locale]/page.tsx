"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { isSameDay } from "date-fns";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { buildCategoryTree } from "@/lib/utils";
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
import { InteractiveOnboarding } from "@/components/onboarding/InteractiveOnboarding";
import { FeedbackModal } from "@/components/feedback/FeedbackModal";
import { JournalModal } from "@/components/journal/JournalModal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Todo } from "@studytodo/shared";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSync } from "@/hooks/useSync";
import { useAuth } from "@/contexts/AuthContext";
import { useModalState } from "@/hooks/useModalState";
import { useTodoHandlers } from "@/hooks/useTodoHandlers";
import { useKeepState } from "@/hooks/useKeepState";
import { useJournalSettings } from "@/hooks/useJournal";
import { dataService } from "@/services/dataService";


export default function Home() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"home" | "timer">("home");
  const [activeTodo, setActiveTodo] = useState<Todo | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [showWelcome] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Client-side rendering guard
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
    setOnboardingCompleted(localStorage.getItem("onboarding_completed") === "true");
  }, []);

  // DB data
  const todos = useLiveQuery(() => db.todos.orderBy("createdAt").reverse().toArray()) || [];
  const categoriesFlat = useLiveQuery(() => db.categories.orderBy("order").toArray()) || [];
  const srsProfiles = useLiveQuery(() => db.srsProfiles.toArray()) || [];
  const sessions = useLiveQuery(() => db.sessions.orderBy("createdAt").reverse().toArray()) || [];
  const categories = buildCategoryTree(categoriesFlat);

  // Custom hooks
  const modals = useModalState();
  const keep = useKeepState();
  const { isSyncing } = useSync();
  const { user, loading: authLoading } = useAuth();
  const { settings: journalSettings } = useJournalSettings();

  const handlers = useTodoHandlers({
    todos,
    srsProfiles,
    selectedDate,
    setIsTodoModalOpen: modals.setIsTodoModalOpen,
    setIsTodoDetailOpen: modals.setIsTodoDetailOpen,
    setActiveTodo,
    setViewMode,
  });

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    onNewTodo: () => {
      if (!modals.isAnyModalOpen && viewMode === "home") {
        modals.setIsTodoModalOpen(true);
      }
    },
    onCloseModal: () => {
      if (modals.isAnyModalOpen) {
        modals.closeAllModals();
      }
    }
  });

  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800">
        <LoadingSpinner size={40} />
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading StudyTodo...</p>
      </div>
    );
  }

  const isFirstTimeUser = !authLoading && !user && todos.length === 0 && sessions.length === 0;

  if (showWelcome && isFirstTimeUser && !onboardingCompleted) {
    return (
      <InteractiveOnboarding
        onComplete={() => setOnboardingCompleted(true)}
      />
    );
  }

  if (viewMode === "timer" && activeTodo) {
    return (
      <TimerView
        todo={activeTodo}
        onBack={handlers.handleBackToHome}
        onSaveSession={handlers.handleSaveSession}
        onCompleteTask={async () => {
          await dataService.updateTodo(activeTodo.id, { completed: true, updatedAt: new Date() });
          handlers.handleBackToHome();
        }}
      />
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col h-full absolute inset-0 pb-20 overflow-hidden">
        <DateBar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onSettingsClick={() => modals.setIsSettingsModalOpen(true)}
          onGuideClick={() => modals.setIsGuideModalOpen(true)}
          onFeedbackClick={() => modals.setIsFeedbackModalOpen(true)}
          isSyncing={isSyncing}
        />

        <div className="flex-1 flex overflow-hidden min-h-0 relative z-0">
          {/* Left: Todo List (30%) */}
          <div className="w-[30%] h-full border-e border-border flex flex-col transition-colors duration-300">
            <div className="px-3 py-2 bg-background border-b border-border transition-colors duration-300">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("todoList")}</h3>
            </div>
            <TodoList
              todos={todos.filter(t =>
                !t.completed &&
                (!t.dueDate || isSameDay(new Date(t.dueDate), selectedDate))
              )}
              categories={categories}
              onTodoClick={modals.openTodoDetail}
              onToggleComplete={handlers.handleToggleTodoComplete}
              onReorder={handlers.handleReorderTodo}
              onStart={handlers.handleStartFromDetail}
            />
          </div>

          {/* Center: Day Schedule (30%) */}
          <div className="w-[30%] h-full border-e border-border bg-background flex flex-col transition-colors duration-300">
            <div className="px-3 py-2 bg-background border-b border-border transition-colors duration-300">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("schedule")}</h3>
            </div>
            <DaySchedule
              keptTime={keep.keptTime}
              keptDate={keep.keptDate}
              onTimeLongPress={keep.handleTimeLongPress}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              todos={todos}
              categories={categoriesFlat}
              onTodoClick={modals.openTodoDetail}
            />
          </div>

          {/* Right: Calendar & Analysis (40%) */}
          <div className="w-[40%] h-full bg-white dark:bg-gray-800 flex flex-col">
            <div className="flex-1 overflow-hidden relative">
              <CalendarPane
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                keptDate={keep.keptDate}
                onDateLongPress={keep.handleDateLongPress}
                sessions={sessions}
                todos={todos}
                categories={categoriesFlat}
              />
            </div>
          </div>
        </div>

        <div className="z-50 relative pointer-events-none">
          <div className="pointer-events-auto">
            <BottomActions
              onOpenTodoModal={() => modals.setIsTodoModalOpen(true)}
              onOpenTemplateModal={() => modals.setIsTemplateModalOpen(true)}
              onOpenActivityModal={() => modals.setIsActivityModalOpen(true)}
              isHighlighted={!!keep.keptDate || !!keep.keptTime}
              onResetKeep={keep.handleResetKeep}
              onOpenJournalModal={() => setIsJournalOpen(true)}
              journalEnabled={journalSettings.enabled}
            />
          </div>
        </div>

        {/* Modals */}
        <TodoCreateModal
          isOpen={modals.isTodoModalOpen}
          onClose={() => modals.setIsTodoModalOpen(false)}
          onCreate={handlers.handleCreateTodo}
          onStartNow={handlers.handleStartNow}
          onRecord={handlers.handleRecordTodo}
          categories={categories}
          srsProfiles={srsProfiles}
          initialDate={keep.keptDate}
          initialTime={keep.keptTime}
        />
        <TemplateModal
          isOpen={modals.isTemplateModalOpen}
          onClose={() => modals.setIsTemplateModalOpen(false)}
        />
        <ActivityModal
          isOpen={modals.isActivityModalOpen}
          onClose={() => modals.setIsActivityModalOpen(false)}
          sessions={sessions}
          todos={todos}
          onDeleteTodo={handlers.handleDeleteTodo}
          onBulkDelete={handlers.handleBulkDelete}
          categories={categories}
          onOpenTodoDetail={modals.openTodoDetail}
        />
        <TodoDetailModal
          isOpen={modals.isTodoDetailOpen}
          onClose={() => modals.setIsTodoDetailOpen(false)}
          todo={modals.selectedTodo}
          categories={categories}
          srsProfiles={srsProfiles}
          onStartNow={handlers.handleStartFromDetail}
          onDelete={handlers.handleDeleteTodo}
          onUpdate={handlers.handleUpdateTodo}
          onRecord={handlers.handleRecordSession}
        />
        <SettingsModal
          isOpen={modals.isSettingsModalOpen}
          onClose={() => modals.setIsSettingsModalOpen(false)}
        />
        <UsageGuideModal
          isOpen={modals.isGuideModalOpen}
          onClose={() => modals.setIsGuideModalOpen(false)}
        />
        <AuthModal
          isOpen={modals.isAuthModalOpen}
          onClose={() => modals.setIsAuthModalOpen(false)}
        />
        <FeedbackModal
          isOpen={modals.isFeedbackModalOpen}
          onClose={() => modals.setIsFeedbackModalOpen(false)}
          onSubmit={handlers.handleFeedbackSubmit}
        />
        <JournalModal
          isOpen={isJournalOpen}
          onClose={() => setIsJournalOpen(false)}
        />
      </div>
    </AppShell>
  );
}
