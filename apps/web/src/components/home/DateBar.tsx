"use client";

import React from "react";
import { User, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { ja } from "date-fns/locale";

interface DateBarProps {
    selectedDate?: Date;
    onDateChange?: (date: Date) => void;
    onSettingsClick?: () => void; // 設定ボタンのクリックハンドラ
}

/**
 * 日付ナビゲーションバーコンポーネント
 * 
 * 画面上部に配置され、日付の表示・切り替え、プロフィール、設定へのアクセスを提供します。
 */
export function DateBar({ selectedDate = new Date(), onDateChange, onSettingsClick }: DateBarProps) {

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
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            {/* プロフィールアイコン（左端） */}
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <User size={20} />
            </button>

            {/* 日付表示とナビゲーション（中央） */}
            <div className="flex items-center space-x-2">
                <button
                    onClick={handlePrevDay}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="text-center min-w-[120px]">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {format(selectedDate, "M月d日(EEE)", { locale: ja })}
                    </div>
                </div>
                <button
                    onClick={handleNextDay}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* 設定アイコン（右端） */}
            <button
                onClick={onSettingsClick}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
                <Settings size={20} />
            </button>
        </div>
    );
}
