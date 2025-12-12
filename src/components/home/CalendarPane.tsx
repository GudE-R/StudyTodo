"use client";

import React, { useState, useRef, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Session } from "@/types";

interface CalendarPaneProps {
    selectedDate?: Date;
    onDateChange?: (date: Date) => void;
    keptDate?: Date | null;
    onDateLongPress?: (date: Date) => void;
    sessions?: Session[];
    isExpanded?: boolean; // 新規追加: 拡大状態
}

/**
 * カレンダーペインコンポーネント（月表示版・スクロール対応）
 * 
 * 画面下部（約1/3）に表示される月次カレンダーです。
 * - isExpanded propにより、グリッドの表示サイズや密度を調整可能にします（今回は単純にスクロール領域を広げるだけですが、将来的にWeekViewとの切り替え等もここで行えます）。
 */
export function CalendarPane({
    selectedDate = new Date(),
    onDateChange,
    keptDate,
    onDateLongPress,
    sessions = [],
    isExpanded = false
}: CalendarPaneProps) {
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
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    const handleClick = (date: Date) => {
        if (!isLongPressRef.current && onDateChange) {
            onDateChange(date);
        }
    };

    // カレンダーグリッドの生成
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    });

    const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

    const getActivityLevel = (date: Date) => {
        const dailySessions = sessions.filter(s => isSameDay(new Date(s.createdAt), date));
        const totalDuration = dailySessions.reduce((acc, s) => acc + s.duration, 0);

        if (totalDuration === 0) return 0;
        if (totalDuration < 30 * 60) return 1;
        if (totalDuration < 60 * 60) return 2;
        if (totalDuration < 3 * 60 * 60) return 3;
        return 4;
    };

    const getHeatmapColor = (level: number) => {
        switch (level) {
            case 1: return "bg-green-100 dark:bg-green-900/40";
            case 2: return "bg-green-200 dark:bg-green-800/50";
            case 3: return "bg-green-300 dark:bg-green-700/60";
            case 4: return "bg-green-400 dark:bg-green-600/70";
            default: return "";
        }
    };

    return (
        <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
            {/* ヘッダー: 年月表示とナビゲーション */}
            <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 flex-none">
                <button
                    onClick={prevMonth}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>

                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    {format(currentMonth, "yyyy年 M月", { locale: ja })}
                </span>

                <button
                    onClick={nextMonth}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* カレンダー本体（スクロール可能領域） */}
            <div className="flex-1 flex flex-col p-1 overflow-y-auto min-h-0">
                {/* 曜日ヘッダー */}
                <div className="grid grid-cols-7 mb-0.5 flex-none sticky top-0 bg-white dark:bg-gray-900 z-10 p-1">
                    {weekDays.map((day, i) => (
                        <div key={i} className="text-center text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                            {day}
                        </div>
                    ))}
                </div>

                {/* 日付グリッド */}
                <div className={`grid grid-cols-7 auto-rows-fr gap-0.5 pb-2 transition-all duration-300 ${isExpanded ? "h-auto min-h-[300px]" : "h-full"}`}>
                    {calendarDays.map((date, i) => {
                        const isCurrentMonth = isSameMonth(date, monthStart);
                        const isToday = isSameDay(date, today);
                        const isSelected = isSameDay(date, selectedDate);
                        const isKept = keptDate && isSameDay(date, keptDate);

                        const activityLevel = getActivityLevel(date);
                        const heatmapColor = !isSelected && !isKept && !isToday ? getHeatmapColor(activityLevel) : "";

                        return (
                            <div key={i} className="flex flex-col items-center justify-center py-1 relative">
                                <button
                                    onMouseDown={() => handleTouchStart(date)}
                                    onMouseUp={handleTouchEnd}
                                    onMouseLeave={handleTouchEnd}
                                    onTouchStart={() => handleTouchStart(date)}
                                    onTouchEnd={handleTouchEnd}
                                    onClick={() => handleClick(date)}
                                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 z-0
                    ${!isCurrentMonth ? "text-gray-300 dark:text-gray-600" : "text-gray-700 dark:text-gray-200"}
                    ${isKept
                                            ? "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 ring-2 ring-orange-400 font-bold scale-110"
                                            : isSelected
                                                ? "bg-blue-600 text-white shadow-md scale-105"
                                                : isToday
                                                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700"
                                                    : heatmapColor || "hover:bg-gray-50 dark:hover:bg-gray-800"}
                  `}
                                >
                                    {format(date, "d")}
                                </button>

                                {/* 拡大時のみ、ドットなどの詳細情報を出しても良い */}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
