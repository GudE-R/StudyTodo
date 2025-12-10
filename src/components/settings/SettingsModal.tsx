"use client";

import React from "react";
import { X, Palette, BookOpen } from "lucide-react";
import { ThemeEditor } from "../template/ThemeEditor";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenGuide: () => void;
}

/**
 * 設定モーダル
 * 
 * テーマ設定と使用ガイドへのアクセスを提供します。
 */
export function SettingsModal({ isOpen, onClose, onOpenGuide }: SettingsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl h-auto max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">設定</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* テーマ設定セクション */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 font-bold border-b border-gray-100 dark:border-gray-800 pb-2">
                            <Palette size={20} className="text-blue-500" />
                            <h3>表示設定</h3>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                            <ThemeEditor />
                        </div>
                    </div>

                    {/* 使用ガイドセクション */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 font-bold border-b border-gray-100 dark:border-gray-800 pb-2">
                            <BookOpen size={20} className="text-green-500" />
                            <h3>サポート</h3>
                        </div>
                        <button
                            onClick={() => {
                                onClose();
                                onOpenGuide();
                            }}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors group"
                        >
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                使い方ガイドを見る
                            </span>
                            <BookOpen size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </button>
                    </div>

                    {/* Version Info (Optional) */}
                    <div className="text-center text-xs text-gray-400 pt-4">
                        PomArc v1.0.0
                    </div>
                </div>
            </div>
        </div>
    );
}
