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
 * 荳矩Κ繧｢繧ｯ繧ｷ繝ｧ繝ｳ繝舌・
 * isHighlighted縺荊rue縺ｮ蝣ｴ蜷医ゝodo菴懈・繝懊ち繝ｳ縺悟ｼｷ隱ｿ陦ｨ遉ｺ縺輔ｌ縺ｾ縺呻ｼ医く繝ｼ繝玲ｩ溯・騾｣謳ｺ譎ゅ↑縺ｩ・峨・
 */
export function BottomActions({
    onOpenTodoModal,
    onOpenTemplateModal,
    isHighlighted = false,
    onResetKeep,
    onOpenActivityModal
}: BottomActionsProps) {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-8 py-3 flex justify-between items-center h-20 z-50 rounded-2xl shadow-2xl w-full max-w-lg transition-all duration-300 hover:scale-[1.02]">
            {/* 繝・Φ繝励Ξ繝ｼ繝井ｽ懈・繝懊ち繝ｳ */}
            <button
                onClick={onOpenTemplateModal}
                className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 space-y-1.5 px-4 group"
            >
                <div className="p-2 rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                    <LayoutTemplate size={24} />
                </div>
                <span className="text-xs font-medium">繝・Φ繝励Ξ繝ｼ繝・/span>
            </button>

            {/* Todo菴懈・繝懊ち繝ｳ・亥ｼｷ隱ｿ陦ｨ遉ｺ・・*/}
            <div className="relative -mt-12">
                <button
                    onClick={onOpenTodoModal}
                    className={`
                        flex flex-col items-center justify-center bg-white dark:bg-gray-800 border-4 border-gray-100 dark:border-gray-900 rounded-full p-4 shadow-xl transition-all duration-300
                        ${isHighlighted
                            ? "text-orange-500 ring-4 ring-orange-100 dark:ring-orange-900/50 scale-110"
                            : "text-blue-600 dark:text-blue-400 hover:scale-110 hover:shadow-2xl"}
                    `}
                >
                    <Plus size={36} strokeWidth={2.5} />
                </button>

                {/* 繝ｪ繧ｻ繝・ヨ繝懊ち繝ｳ・医く繝ｼ繝嶺ｸｭ縺ｮ縺ｿ陦ｨ遉ｺ・・*/}
                {isHighlighted && onResetKeep && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onResetKeep();
                        }}
                        className="absolute -right-1 top-0 bg-gray-500 text-white rounded-full p-1.5 shadow-md hover:bg-gray-600 transition-colors animate-in zoom-in duration-200"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* 繧｢繧ｯ繝・ぅ繝薙ユ繧｣繝懊ち繝ｳ */}
            <button
                onClick={onOpenActivityModal}
                className="flex flex-col items-center justify-center space-y-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-4 group"
            >
                <div className="p-2 rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                    <BarChart2 size={24} />
                </div>
                <span className="text-xs font-medium">Activity</span>
            </button>
        </div>
    );
}
