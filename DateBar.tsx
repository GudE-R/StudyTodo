import React from "react";
import { User, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { ja } from "date-fns/locale";

interface DateBarProps {
    selectedDate?: Date;
    onDateChange?: (date: Date) => void;
}

/**
 * 日付ナビゲーションバーコンポーネント
 * 
 * 画面上部に配置され、日付の表示・切り替え、プロフィール、設定へのアクセスを提供します。
 * selectedDateが渡された場合、その日付を表示し、ナビゲーション操作で変更します。
 */
export function DateBar({ selectedDate = new Date(), onDateChange }: DateBarProps) {

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
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
            {/* プロフィールアイコン（左端） */}
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                <User size={20} />
            </button>

            {/* 日付表示とナビゲーション（中央） */}
            <div className="flex items-center space-x-2">
                <button
                    onClick={handlePrevDay}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="text-center min-w-[120px]">
                    {/* date-fnsを使用して日本語形式で日付を表示 */}
                    <div className="text-sm font-medium text-gray-900">
                        {format(selectedDate, "M月d日(EEE)", { locale: ja })}
                    </div>
                </div>
                <button
                    onClick={handleNextDay}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* 設定アイコン（右端） */}
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                <Settings size={20} />
            </button>
        </div>
    );
}
