"use client";

import React from "react";
import { Settings, ChevronLeft, ChevronRight, HelpCircle, MessageSquare, Cloud } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { getDateFnsLocale } from "@/lib/date-fns-locales";

interface DateBarProps {
    selectedDate?: Date;
    onDateChange?: (date: Date) => void;
    onSettingsClick?: () => void;
    onGuideClick?: () => void;
    onFeedbackClick?: () => void;
    isSyncing?: boolean;
}

export function DateBar({ selectedDate = new Date(), onDateChange, onSettingsClick, onGuideClick, onFeedbackClick, isSyncing = false }: DateBarProps) {
    const locale = useLocale();
    const t = useTranslations("common");
    const dateFnsLocale = getDateFnsLocale(locale);

    const handlePrevDay = () => {
        if (onDateChange) {
            onDateChange(subDays(selectedDate, 1));
        }
    };

    const handleNextDay = () => {
        if (onDateChange) {
            onDateChange(addDays(selectedDate, 1));
        }
    };

    return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card transition-colors duration-300">
            {/* 日付表示とナビゲーション（中央） */}
            <div className="flex-1 flex items-center justify-center space-x-4">
                <button
                    onClick={handlePrevDay}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="text-center min-w-[140px]">
                    <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                        {format(selectedDate, t("dateFormat"), { locale: dateFnsLocale })}
                    </div>
                </div>
                <button
                    onClick={handleNextDay}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Sync Indicator */}
            {isSyncing && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full mr-2">
                    <Cloud size={14} className="text-blue-500 animate-pulse" />
                    <span className="text-xs text-blue-600 dark:text-blue-400">Syncing...</span>
                </div>
            )}

            {/* アクションボタン（右端） */}
            <div className="flex items-center space-x-1">
                <button
                    onClick={onSettingsClick}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    title={t("settings")}
                >
                    <Settings size={20} />
                </button>
                <button
                    onClick={onGuideClick}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    title={t("usageGuide")}
                >
                    <HelpCircle size={20} />
                </button>
                <button
                    onClick={onFeedbackClick}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    title={t("sendFeedback")}
                >
                    <MessageSquare size={20} />
                </button>
            </div>
        </div>
    );
}
