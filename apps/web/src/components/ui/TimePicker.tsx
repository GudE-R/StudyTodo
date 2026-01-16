"use client";

import React, { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

interface TimePickerProps {
    value: string;
    onChange: (time: string) => void;
    placeholder?: string;
    disabled?: boolean;
    defaultTime?: string;
    icon?: React.ReactNode; // カスタムアイコン
}

/**
 * カスタム時間選択コンポーネント (ドラムロール風)
 * 
 * 時間(HH)と分(MM)をそれぞれ独立してスクロール選択できるUIを提供します。
 * 分は5分刻みで表示されます。
 */
export function TimePicker({ value, onChange, placeholder = "時間を選択", disabled = false, defaultTime, icon }: TimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const hourRef = useRef<HTMLUListElement>(null);
    const minuteRef = useRef<HTMLUListElement>(null);

    // 時間と分の配列生成
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"));

    // 現在の値から時間と分を抽出（値がない場合はdefaultTime、それもなければ空）
    const [selectedHour, selectedMinute] = value
        ? value.split(":")
        : (defaultTime ? defaultTime.split(":") : ["", ""]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // モーダルが開いた時に、現在選択されている位置までスクロール
    useEffect(() => {
        if (isOpen) {
            // 時間のスクロール位置調整
            if (selectedHour && hourRef.current) {
                const hourIndex = hours.indexOf(selectedHour);
                if (hourIndex !== -1) {
                    hourRef.current.scrollTop = hourIndex * 32 - 64; // 中央に表示されるように調整
                }
            }
            // 分のスクロール位置調整
            if (selectedMinute && minuteRef.current) {
                const minuteIndex = minutes.indexOf(selectedMinute);
                if (minuteIndex !== -1) {
                    minuteRef.current.scrollTop = minuteIndex * 32 - 64;
                }
            }
        }
    }, [isOpen, selectedHour, selectedMinute]);

    const handleHourChange = (h: string) => {
        const m = selectedMinute || "00";
        onChange(`${h}:${m}`);
    };

    const handleMinuteChange = (m: string) => {
        const h = selectedHour || "00";
        onChange(`${h}:${m}`);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
          w-full flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-sm outline-none transition-colors
          ${isOpen ? "ring-2 ring-blue-100 bg-white dark:bg-gray-600" : disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 dark:hover:bg-gray-600"}
        `}
            >
                {icon || <Clock size={18} className="text-gray-500" />}
                <span className={value ? "text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}>
                    {value || placeholder}
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex h-48">
                        {/* 時間 (Hours) カラム */}
                        <div className="flex-1 border-r border-gray-100 dark:border-gray-700 relative">
                            <div className="sticky top-0 bg-gray-50 dark:bg-gray-700 text-xs text-center py-1 text-gray-500 dark:text-gray-400 font-bold z-10">時</div>
                            <ul ref={hourRef} className="h-full overflow-y-auto scrollbar-hide py-16">
                                {hours.map((h) => (
                                    <li key={h} className="flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => handleHourChange(h)}
                                            className={`
                        w-full py-1 text-sm transition-colors
                        ${h === selectedHour ? "text-blue-600 font-bold scale-110" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}
                      `}
                                        >
                                            {h}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 分 (Minutes) カラム */}
                        <div className="flex-1 relative">
                            <div className="sticky top-0 bg-gray-50 dark:bg-gray-700 text-xs text-center py-1 text-gray-500 dark:text-gray-400 font-bold z-10">分</div>
                            <ul ref={minuteRef} className="h-full overflow-y-auto scrollbar-hide py-16">
                                {minutes.map((m) => (
                                    <li key={m} className="flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => handleMinuteChange(m)}
                                            className={`
                        w-full py-1 text-sm transition-colors
                        ${m === selectedMinute ? "text-blue-600 font-bold scale-110" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"}
                      `}
                                        >
                                            {m}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 中央のハイライトバー（視覚的ガイド） */}
                        <div className="absolute top-1/2 left-0 right-0 h-8 -mt-4 bg-blue-50 dark:bg-blue-900/30 -z-10 pointer-events-none opacity-50" />
                    </div>
                </div>
            )}
        </div>
    );
}
