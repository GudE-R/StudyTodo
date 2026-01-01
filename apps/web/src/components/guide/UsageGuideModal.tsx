"use client";

import React from "react";
import { X, Play, Calendar, Clock, Repeat, FolderTree, Palette, Timer, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";

interface UsageGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * 使用ガイドモーダルコンポーネント
 * 
 * PomArcの主要機能の使い方を説明します。
 */
export function UsageGuideModal({ isOpen, onClose }: UsageGuideModalProps) {
    const t = useTranslations("guide");
    const tc = useTranslations("common");

    if (!isOpen) return null;

    const guides = [
        {
            icon: Play,
            title: t("createTaskTitle"),
            description: t("createTaskDesc")
        },
        {
            icon: Timer,
            title: t("timerTitle"),
            description: t("timerDesc")
        },
        {
            icon: Calendar,
            title: t("calendarTitle"),
            description: t("calendarDesc")
        },
        {
            icon: Repeat,
            title: t("srsTitle"),
            description: t("srsDesc")
        },
        {
            icon: FolderTree,
            title: t("categoryTitle"),
            description: t("categoryDesc")
        },
        {
            icon: Palette,
            title: t("themeTitle"),
            description: t("themeDesc")
        },
        {
            icon: Clock,
            title: t("historyTitle"),
            description: t("historyDesc")
        },
        {
            icon: BookOpen,
            title: t("detailTitle"),
            description: t("detailDesc")
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t("title")}</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {guides.map((guide, index) => {
                        const Icon = guide.icon;
                        return (
                            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                        <Icon className="text-blue-600 dark:text-blue-400" size={20} />
                                    </div>
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{guide.title}</h3>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {guide.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors"
                    >
                        {tc("close")}
                    </button>
                </div>
            </div>
        </div>
    );
}
