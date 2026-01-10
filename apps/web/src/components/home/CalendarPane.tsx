"use client";

import React, { useState, useRef, useEffect } from "react";
import { format, addDays, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { useLocale, useTranslations, useFormatter } from "next-intl";
import { getDateFnsLocale } from "@/lib/date-fns-locales";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Session, Todo, Category } from "@pomarc/shared";

interface CalendarPaneProps {
    selectedDate?: Date;
    onDateChange?: (date: Date) => void;
    keptDate?: Date | null;
    onDateLongPress?: (date: Date) => void;
    sessions?: Session[];
    todos?: Todo[];
    categories?: Category[];
    isExpanded?: boolean;
    readOnly?: boolean;
    hideHeader?: boolean;
    className?: string;
}

export function CalendarPane({
    selectedDate = new Date(),
    onDateChange,
    keptDate,
    onDateLongPress,
    sessions = [],
    todos = [],
    categories = [],
    isExpanded = false,
    readOnly = false,
    hideHeader = false,
    className = ""
}: CalendarPaneProps) {
    const locale = useLocale();
    const t = useTranslations("common");
    const formatIntl = useFormatter();
    const dateFnsLocale = getDateFnsLocale(locale);
    const [currentMonth, setCurrentMonth] = useState(selectedDate);
    const today = new Date();

    // selectedDateが変わったら、その月を表示するように同期
    useEffect(() => {
        if (!isSameMonth(currentMonth, selectedDate)) {
            setCurrentMonth(selectedDate);
        }
    }, [selectedDate]);

    // 長押し判定用のタイマー参照
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPressRef = useRef(false);

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const handleTouchStart = (date: Date) => {
        if (readOnly) return;
        isLongPressRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            if (onDateLongPress) {
                onDateLongPress(date);
                if (navigator.vibrate) navigator.vibrate(50);
            }
        }, 500);
    };

    const handleTouchEnd = () => {
        if (readOnly) return;
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const handleClick = (date: Date) => {
        if (readOnly) return;
        if (!isLongPressRef.current && onDateChange) {
            onDateChange(date);
        }
    };

    // カレンダーグリッドの生成
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { locale: dateFnsLocale });
    const calendarEnd = endOfWeek(monthEnd, { locale: dateFnsLocale });

    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    });

    // 曜日のリストを取得 (ロケールに合わせる)
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const day = addDays(calendarStart, i);
        return format(day, "EEEEEE", { locale: dateFnsLocale });
    });

    const getActivityLevel = (totalDuration: number) => {
        if (totalDuration === 0) return 0;
        if (totalDuration < 15 * 60) return 1;
        if (totalDuration < 60 * 60) return 2;
        if (totalDuration < 2 * 60 * 60) return 3;
        return 4;
    };

    const getHeatmapColor = (level: number) => {
        // 枠のみ（ボーダー）に変更し、背景は塗らない
        switch (level) {
            case 1: return "border border-green-300 dark:border-green-800";
            case 2: return "border-2 border-green-400 dark:border-green-700";
            case 3: return "border-[3px] border-green-500 dark:border-green-600";
            case 4: return "border-[4px] border-green-600 dark:border-green-500";
            default: return "border border-gray-100 dark:border-gray-800";
        }
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}${t("units.hours")}${m}${t("units.minutes")}`;
        return `${m}${t("units.minutes")}`;
    };

    return (
        <div className={`h-full bg-card flex flex-col transition-colors duration-300 ${className}`}>
            {/* ヘッダー: 年月表示とナビゲーション */}
            {!hideHeader && (
                <div className="px-4 py-2 flex items-center justify-between border-b border-border flex-none">
                    <button
                        onClick={prevMonth}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                        {formatIntl.dateTime(currentMonth, { year: 'numeric', month: 'long' })}
                    </span>

                    <button
                        onClick={nextMonth}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* カレンダー本体（スクロール可能領域） */}
            <div className={`flex-1 flex flex-col p-2 min-h-0 ${readOnly ? "overflow-hidden" : "overflow-y-auto"}`}>
                {/* 曜日ヘッダー */}
                <div className="grid grid-cols-7 mb-1 flex-none sticky top-0 bg-card z-10">
                    {weekDays.map((day, i) => (
                        <div key={i} className="text-center text-[10px] text-gray-400 dark:text-gray-500 font-medium pb-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* 日付グリッド */}
                <div className={`grid grid-cols-7 auto-rows-fr gap-1 pb-2 transition-all duration-300 ${isExpanded ? "h-auto min-h-[300px]" : "h-full"}`}>
                    {calendarDays.map((date, i) => {
                        const isCurrentMonth = isSameMonth(date, monthStart);
                        const isToday = isSameDay(date, today);
                        const isSelected = isSameDay(date, selectedDate);
                        const isKept = keptDate && isSameDay(date, keptDate);

                        // Stats Calculation
                        const dailySessions = sessions.filter(s => isSameDay(new Date(s.createdAt), date));
                        const totalDuration = dailySessions.reduce((acc, s) => acc + s.duration, 0);
                        const activityLevel = getActivityLevel(totalDuration);
                        const heatmapClass = getHeatmapColor(activityLevel);

                        // Todo Stats Calculation
                        const dailyTodos = todos.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), date));
                        const completedTodos = dailyTodos.filter(t => t.completed);
                        const pendingTodos = dailyTodos.filter(t => !t.completed);

                        // Tooltip Text
                        const dateStr = format(date, t("dateFormat"), { locale: dateFnsLocale });
                        const statsStr = totalDuration > 0
                            ? `${t("study")}: ${formatDuration(totalDuration)} (${dailySessions.length}${t("times")})`
                            : t("noStudyRecords");
                        const todoStr = dailyTodos.length > 0
                            ? `${t("tasks")}: ${dailyTodos.length}${t("units.items")} (${t("completed")}: ${completedTodos.length} / ${t("pending")}: ${pendingTodos.length})`
                            : t("taskPlanned");
                        const tooltipText = `${dateStr}\n${statsStr}\n${todoStr}`;

                        return (
                            <div key={i} className="flex flex-col items-center justify-center relative aspect-square">
                                <button
                                    title={!readOnly ? tooltipText : undefined}
                                    onMouseDown={() => handleTouchStart(date)}
                                    onMouseUp={handleTouchEnd}
                                    onMouseLeave={handleTouchEnd}
                                    onTouchStart={() => handleTouchStart(date)}
                                    onTouchEnd={handleTouchEnd}
                                    onClick={() => handleClick(date)}
                                    disabled={readOnly}
                                    className={`
                    w-full h-full rounded-sm flex flex-col items-center justify-center text-xs transition-all duration-200 z-0 relative py-1
                    ${!isCurrentMonth ? "opacity-30 grayscale" : ""}
                    ${!readOnly && isSelected
                                            ? "ring-2 ring-blue-500 z-10"
                                            : !readOnly && isToday
                                                ? "ring-1 ring-blue-400 dark:ring-blue-500"
                                                : !readOnly ? "hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600" : ""}
                    ${!readOnly && (isSelected || isToday) ? "" : heatmapClass}
                    ${!readOnly && isKept ? "ring-2 ring-orange-400 bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400" : ""}
                    ${!readOnly && (isSelected || isToday) && activityLevel > 0 ? heatmapClass : ""}
                    ${!readOnly && (isSelected || isToday) && activityLevel === 0 ? "bg-white dark:bg-gray-800" : ""}
                  `}
                                >
                                    <span className={`
                                        font-medium
                                        ${!isCurrentMonth ? "text-gray-400 dark:text-gray-600" : "text-gray-700 dark:text-gray-300"}
                                    `}>
                                        {format(date, "d")}
                                    </span>

                                    {/* Task Indicators (Dots) */}
                                    {dailyTodos.length > 0 && (
                                        <div className="flex justify-center space-x-0.5 mt-0.5 px-0.5 overflow-hidden w-full max-w-[24px]">
                                            {/* Show up to 3 dots, then a special mark */}
                                            {dailyTodos.slice(0, 3).map((t, idx) => {
                                                const category = categories?.find(c => c.id === t.categoryId);
                                                // デフォルト色は完了状態で切り替えるが、カテゴリ色がある場合は優先
                                                const dotColor = category?.color || (t.completed ? "#22c55e" : "#3b82f6");

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="w-1.5 h-1.5 rounded-full"
                                                        style={{ backgroundColor: dotColor }}
                                                    />
                                                );
                                            })}
                                            {dailyTodos.length > 3 && (
                                                <div className="text-[6px] leading-[4px] text-gray-400 font-bold">+</div>
                                            )}
                                        </div>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
