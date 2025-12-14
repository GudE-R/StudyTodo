"use client";

import React, { useEffect, useState } from "react";
import { X, Moon, Sun, Monitor, BookOpen } from "lucide-react";
import { useTheme } from "next-themes";
import { UsageGuideModal } from "@/components/guide/UsageGuideModal";

interface SettingsModalProps {
    onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    if (showGuide) {
        return <UsageGuideModal onClose={() => setShowGuide(false)} />;
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">設定</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {/* Theme Settings */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">テーマ設定</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setTheme("light")}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${theme === "light" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"}`}
                            >
                                <Sun size={20} className="mb-2" />
                                <span className="text-xs font-medium">ライト</span>
                            </button>
                            <button
                                onClick={() => setTheme("dark")}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${theme === "dark" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"}`}
                            >
                                <Moon size={20} className="mb-2" />
                                <span className="text-xs font-medium">ダーク</span>
                            </button>
                            <button
                                onClick={() => setTheme("system")}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${theme === "system" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"}`}
                            >
                                <Monitor size={20} className="mb-2" />
                                <span className="text-xs font-medium">端末設定</span>
                            </button>
                        </div>
                    </div>

                    {/* Usage Guide */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">アプリについて</h3>
                        <button
                            onClick={() => setShowGuide(true)}
                            className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <BookOpen size={20} className="text-gray-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">使い方ガイドを見る</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
