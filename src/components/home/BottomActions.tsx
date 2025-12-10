"use client";

import { LayoutTemplate, Plus, X, BarChart2 } from "lucide-react";

interface BottomActionsProps {
    onOpenTodoModal: () => void;
    onOpenTemplateModal: () => void;
    isHighlighted?: boolean;
    onResetKeep?: () => void;
    onOpenActivityModal: () => void;
}

/**
 * 下部アクションバー
 * isHighlightedがtrueの場合、Todo作成ボタンが強調表示されます（キープ機能連携時など）。
 */
export function BottomActions({
    onOpenTodoModal,
    onOpenTemplateModal,
    isHighlighted = false,
    onResetKeep,
    onOpenActivityModal
}: BottomActionsProps) {
    return (
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-2 flex justify-around items-center h-16 z-50">
            {/* テンプレート作成ボタン */}
            <button
                onClick={onOpenTemplateModal}
                className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 space-y-1"
            >
                <LayoutTemplate size={20} />
                <span className="text-[10px]">テンプレ</span>
            </button>

            {/* Todo作成ボタン（強調表示） */}
            <div className="relative -mt-6">
                <button
                    onClick={onOpenTodoModal}
                    className={`
                        flex flex-col items-center justify-center bg-white dark:bg-gray-800 border rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300
                        ${isHighlighted
                            ? "text-orange-500 border-orange-200 dark:border-orange-700 ring-4 ring-orange-100 dark:ring-orange-900 scale-110"
                            : "text-blue-600 dark:text-blue-400 border-gray-100 dark:border-gray-700 hover:scale-105"}
                    `}
                >
                    <Plus size={28} />
                </button>

                {/* リセットボタン（キープ中のみ表示） */}
                {isHighlighted && onResetKeep && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onResetKeep();
                        }}
                        className="absolute -right-2 -top-2 bg-gray-500 text-white rounded-full p-1 shadow-md hover:bg-gray-600 transition-colors animate-in zoom-in duration-200"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* アクティビティボタン */}
            <button
                onClick={onOpenActivityModal}
                className="flex flex-col items-center justify-center space-y-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
                <BarChart2 size={24} />
                <span className="text-[10px] font-medium">Activity</span>
            </button>
        </div>
    );
}
