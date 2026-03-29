"use client";

import React, { useState, useRef, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface DatePickerProps {
    value: Date | null;
    onChange: (date: Date) => void;
    placeholder?: string;
}

/**
 * カスタム日付選択コンポーネント
 * 
 * 西暦・月表示（例：2025年 11月）のカレンダーを提供します。
 * 外部ライブラリに依存せず、date-fnsを使用してカレンダーロジックを実装しています。
 */
export function DatePicker({ value, onChange, placeholder = "日付を選択" }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value || new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    // クリック時のイベントリスナー設定
    // コンポーネント外をクリックした場合にカレンダーを閉じる処理
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (value) {
            setCurrentMonth(value);
        }
    }, [value]);

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    // カレンダーグリッドの生成ロジック
    // 1. 現在表示している月の開始日と終了日を取得
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    // 2. カレンダー表示用に、開始週の日曜日と終了週の土曜日まで範囲を拡張
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    // 3. 表示範囲内のすべての日付配列を生成
    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    });

    const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

    const handleDateClick = (date: Date) => {
        onChange(date);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full h-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
          w-full h-full flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-sm outline-none transition-colors
          ${isOpen ? "ring-2 ring-[var(--accent-secondary)] bg-white dark:bg-gray-600" : "hover:bg-gray-100 dark:hover:bg-gray-600"}
        `}
            >
                <CalendarIcon size={18} className="text-gray-500" />
                <span className={value ? "text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}>
                    {value ? format(value, "yyyy年 M月d日(E)", { locale: ja }) : placeholder}
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full start-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                            {format(currentMonth, "yyyy年 M月", { locale: ja })}
                        </span>
                        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Week Days */}
                    <div className="grid grid-cols-7 mb-1">
                        {weekDays.map((day, i) => (
                            <div key={i} className="text-center text-[10px] text-gray-400 font-medium">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((date, i) => {
                            const isCurrentMonth = isSameMonth(date, monthStart);
                            const isSelected = value && isSameDay(date, value);
                            const isToday = isSameDay(date, new Date());

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleDateClick(date)}
                                    className={`
                    h-8 w-8 rounded-full flex items-center justify-center text-xs transition-colors
                    ${!isCurrentMonth ? "text-gray-300 dark:text-gray-600" : "text-gray-700 dark:text-gray-200"}
                    ${isSelected ? "text-white font-bold shadow-md bg-[var(--accent-primary)]" : isToday ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold" : "hover:bg-gray-100 dark:hover:bg-gray-700"}
                  `}
                                >
                                    {format(date, "d")}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
