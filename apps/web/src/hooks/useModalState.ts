"use client";

import { useState } from "react";
import { Todo } from "@studytodo/shared";

export function useModalState() {
    const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isTodoDetailOpen, setIsTodoDetailOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

    const isAnyModalOpen =
        isTodoModalOpen || isTemplateModalOpen || isActivityModalOpen ||
        isSettingsModalOpen || isGuideModalOpen || isTodoDetailOpen || isFeedbackModalOpen;

    const closeAllModals = () => {
        setIsTodoModalOpen(false);
        setIsTemplateModalOpen(false);
        setIsActivityModalOpen(false);
        setIsSettingsModalOpen(false);
        setIsGuideModalOpen(false);
        setIsAuthModalOpen(false);
        setIsTodoDetailOpen(false);
    };

    const openTodoDetail = (todo: Todo) => {
        setSelectedTodo(todo);
        setIsTodoDetailOpen(true);
    };

    return {
        isTodoModalOpen, setIsTodoModalOpen,
        isTemplateModalOpen, setIsTemplateModalOpen,
        isActivityModalOpen, setIsActivityModalOpen,
        isSettingsModalOpen, setIsSettingsModalOpen,
        isGuideModalOpen, setIsGuideModalOpen,
        isAuthModalOpen, setIsAuthModalOpen,
        isTodoDetailOpen, setIsTodoDetailOpen,
        isFeedbackModalOpen, setIsFeedbackModalOpen,
        selectedTodo,
        isAnyModalOpen,
        closeAllModals,
        openTodoDetail,
    };
}
