"use client";

import React from "react";

interface WeekdayPickerProps {
    value: number[];
    onChange: (days: number[]) => void;
    disabled?: boolean;
}

const WEEKDAYS = [
    { day: 0, label: "日", labelEn: "S" },
    { day: 1, label: "月", labelEn: "M" },
    { day: 2, label: "火", labelEn: "T" },
    { day: 3, label: "水", labelEn: "W" },
    { day: 4, label: "木", labelEn: "T" },
    { day: 5, label: "金", labelEn: "F" },
    { day: 6, label: "土", labelEn: "S" },
];

/**
 * 曜日選択ピッカー
 * 
 * ルーティーン機能で使用する曜日選択UIコンポーネント。
 * 選択された曜日は配列として管理される（0=日曜、6=土曜）。
 */
export function WeekdayPicker({ value, onChange, disabled = false }: WeekdayPickerProps) {
    const toggleDay = (day: number) => {
        if (disabled) return;

        if (value.includes(day)) {
            onChange(value.filter(d => d !== day));
        } else {
            onChange([...value, day].sort((a, b) => a - b));
        }
    };

    return (
        <div className="flex items-center justify-between gap-1">
            {WEEKDAYS.map(({ day, label }) => {
                const isSelected = value.includes(day);
                const isWeekend = day === 0 || day === 6;

                return (
                    <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        disabled={disabled}
                        className={`
                            w-8 h-8 rounded-full text-xs font-bold transition-all
                            ${isSelected
                                ? "bg-blue-500 text-white shadow-md"
                                : isWeekend
                                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }
                            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                        `}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
