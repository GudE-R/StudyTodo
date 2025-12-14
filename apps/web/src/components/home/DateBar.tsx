"use client";

import React from "react";
import { User, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { ja } from "date-fns/locale";

interface DateBarProps {
    selectedDate?: Date;
    onDateChange?: (date: Date) => void;
    onSettingsClick?: () => void; // 險ｭ螳壹・繧ｿ繝ｳ縺ｮ繧ｯ繝ｪ繝・け繝上Φ繝峨Λ
}

/**
 * 譌･莉倥リ繝薙ご繝ｼ繧ｷ繝ｧ繝ｳ繝舌・繧ｳ繝ｳ繝昴・繝阪Φ繝・
 * 
 * 逕ｻ髱｢荳企Κ縺ｫ驟咲ｽｮ縺輔ｌ縲∵律莉倥・陦ｨ遉ｺ繝ｻ蛻・ｊ譖ｿ縺医√・繝ｭ繝輔ぅ繝ｼ繝ｫ縲∬ｨｭ螳壹∈縺ｮ繧｢繧ｯ繧ｻ繧ｹ繧呈署萓帙＠縺ｾ縺吶・
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
            {/* 繝励Ο繝輔ぅ繝ｼ繝ｫ繧｢繧､繧ｳ繝ｳ・亥ｷｦ遶ｯ・・*/}
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                <User size={20} />
            </button>

            {/* 譌･莉倩｡ｨ遉ｺ縺ｨ繝翫ン繧ｲ繝ｼ繧ｷ繝ｧ繝ｳ・井ｸｭ螟ｮ・・*/}
            <div className="flex items-center space-x-2">
                <button
                    onClick={handlePrevDay}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="text-center min-w-[120px]">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {format(selectedDate, "M譛・譌･(EEE)", { locale: ja })}
                    </div>
                </div>
                <button
                    onClick={handleNextDay}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* 險ｭ螳壹い繧､繧ｳ繝ｳ・亥承遶ｯ・・*/}
            <button
                onClick={onSettingsClick}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
                <Settings size={20} />
            </button>
        </div>
    );
}
