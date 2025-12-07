import { LayoutTemplate, Plus, X, BarChart2 } from "lucide-react";

interface BottomActionsProps {
    onOpenTodoModal: () => void;
    onOpenTemplateModal: () => void;
    isHighlighted?: boolean;
    onResetKeep?: () => void;
    onOpenActivityModal: () => void;
}

/**
 * isHighlightedがtrueの場合、Todo作成ボタンが強調表示されます（キープ機能連携時など）。
 * また、その際にリセットボタン（×）を表示します。
 */
export function BottomActions({
    onOpenTodoModal,
    onOpenTemplateModal,
    isHighlighted = false,
    onResetKeep,
    onOpenActivityModal
}: BottomActionsProps) {
    return (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around items-center h-16">
            {/* テンプレート作成ボタン */}
            <button
                onClick={onOpenTemplateModal}
                className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 space-y-1"
            >
                <LayoutTemplate size={20} />
                <span className="text-[10px]">テンプレ</span>
            </button>

            {/* Todo作成ボタン（強調表示） */}
            <div className="relative -mt-6">
                <button
                    onClick={onOpenTodoModal}
                    className={`
                        flex flex-col items-center justify-center bg-white border rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300
                        ${isHighlighted
                            ? "text-orange-500 border-orange-200 ring-4 ring-orange-100 scale-110"
                            : "text-blue-600 border-gray-100 hover:scale-105"}
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
                className="flex flex-col items-center justify-center space-y-1 text-gray-500 hover:text-blue-600 transition-colors"
            >
                <BarChart2 size={24} />
                <span className="text-[10px] font-medium">Activity</span>
            </button>
        </div>
    );
}
