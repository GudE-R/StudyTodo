"use client";

import React, { useState, useRef, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Session } from "@pomarc/shared";

interface CalendarPaneProps {
    selectedDate?: Date;
    onDateChange?: (date: Date) => void;
    keptDate?: Date | null;
    onDateLongPress?: (date: Date) => void;
    sessions?: Session[];
    isExpanded?: boolean; // 新規追加: 拡大状慁E
}

/**
 * カレンダーペインコンポ�Eネント（月表示版�Eスクロール対応！E
 * 
 * 画面下部�E�紁E/3�E�に表示される月次カレンダーです、E
 * - isExpanded propにより、グリチE��の表示サイズめE��E��を調整可能にします（今回は単純にスクロール領域を庁E��るだけですが、封E��皁E��WeekViewとの刁E��替え等もここで行えます）、E
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

    // 長押し判定用のタイマ�E参�E
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

    // カレンダーグリチE��の生�E
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    });

    const weekDays = ["日", "朁E, "火", "水", "木", "釁E, "圁E];

    const getActivityLevel = (totalDuration: number) => {
        if (totalDuration === 0) return 0;
        if (totalDuration < 15 * 60) return 1; // 15刁E��満
        if (totalDuration < 60 * 60) return 2; // 1時間未満
        if (totalDuration < 2 * 60 * 60) return 3; // 2時間未満
        return 4; // 2時間以丁E
    };

    const getHeatmapColor = (level: number) => {
        switch (level) {
            case 1: return "bg-green-200 dark:bg-green-900/60 border border-green-300 dark:border-green-800";
            case 2: return "bg-green-300 dark:bg-green-800/70 border border-green-400 dark:border-green-700";
            case 3: return "bg-green-400 dark:bg-green-700/80 border border-green-500 dark:border-green-600";
            case 4: return "bg-green-500 dark:bg-green-600 border border-green-600 dark:border-green-500";
            default: return "bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800";
        }
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}時間${m}刁E;
        return `${m}刁E;
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
                    {format(currentMonth, "yyyy年 M朁E, { locale: ja })}
                </span>

                <button
                    onClick={nextMonth}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* カレンダー本体（スクロール可能領域�E�E*/}
            <div className="flex-1 flex flex-col p-2 overflow-y-auto min-h-0">
                {/* 曜日ヘッダー */}
                <div className="grid grid-cols-7 mb-1 flex-none sticky top-0 bg-white dark:bg-gray-900 z-10">
                    {weekDays.map((day, i) => (
                        <div key={i} className="text-center text-[10px] text-gray-400 dark:text-gray-500 font-medium pb-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* 日付グリチE�� */}
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

                        // Tooltip Text
                        const dateStr = format(date, "M/d(E)", { locale: ja });
                        const statsStr = totalDuration > 0
                            ? `${formatDuration(totalDuration)} / ${dailySessions.length}セチE��ョン`
                            : "学習記録なぁE;
                        const tooltipText = `${dateStr}\n${statsStr}`;

                        return (
                            <div key={i} className="flex flex-col items-center justify-center relative aspect-square">
                                <button
                                    title={tooltipText} // Tooltip
                                    onMouseDown={() => handleTouchStart(date)}
                                    onMouseUp={handleTouchEnd}
                                    onMouseLeave={handleTouchEnd}
                                    onTouchStart={() => handleTouchStart(date)}
                                    onTouchEnd={handleTouchEnd}
                                    onClick={() => handleClick(date)}
                                    className={`
                    w-full h-full rounded-sm flex items-center justify-center text-xs transition-all duration-200 z-0
                    ${!isCurrentMonth ? "opacity-30 grayscale" : ""}
                    ${isSelected
                                            ? "ring-2 ring-blue-500 z-10"
                                            : isToday
                                                ? "ring-1 ring-blue-400 dark:ring-blue-500"
                                                : "hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600"}
                    ${isSelected || isToday ? "" : heatmapClass}
                    ${isKept ? "ring-2 ring-orange-400 bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400" : ""}
                    ${(isSelected || isToday) && activityLevel > 0 ? heatmapClass : ""}
                    ${(isSelected || isToday) && activityLevel === 0 ? "bg-white dark:bg-gray-800" : ""}
                  `}
                                >
                                    <span className={`
                                        ${activityLevel > 2 ? "text-white drop-shadow-md font-medium" : "text-gray-700 dark:text-gray-300"}
                                        ${!isCurrentMonth ? "text-gray-400 dark:text-gray-600" : ""}
                                    `}>
                                        {format(date, "d")}
                                    </span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
