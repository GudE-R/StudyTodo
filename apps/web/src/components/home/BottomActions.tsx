import { useTranslations } from "next-intl";
import { FolderTree, Plus, X, BarChart2, BookOpen } from "lucide-react";

interface BottomActionsProps {
    onOpenTodoModal: () => void;
    onOpenTemplateModal: () => void;
    isHighlighted?: boolean;
    onResetKeep?: () => void;
    onOpenActivityModal: () => void;
    onOpenJournalModal?: () => void;
    journalEnabled?: boolean;
}

export function BottomActions({
    onOpenTodoModal,
    onOpenTemplateModal,
    isHighlighted = false,
    onResetKeep,
    onOpenActivityModal,
    onOpenJournalModal,
    journalEnabled = false,
}: BottomActionsProps) {
    const t = useTranslations("common");
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-8 py-3 flex justify-between items-center h-20 z-50 rounded-2xl shadow-2xl w-full max-w-lg transition-all duration-300 hover:scale-[1.02]">
            {/* Journal button */}
            {journalEnabled && onOpenJournalModal && (
                <button
                    onClick={onOpenJournalModal}
                    className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:opacity-80 space-y-1.5 px-4 group"
                    style={{ ["--btn-accent" as string]: "var(--accent-primary)" }}
                >
                    <div className="p-2 rounded-xl transition-colors" style={{ backgroundColor: "transparent" }}>
                        <BookOpen size={24} className="group-hover:text-[var(--accent-primary)]" />
                    </div>
                    <span className="text-xs font-medium">{t("journal", { defaultValue: "Journal" })}</span>
                </button>
            )}

            {/* テンプレート作成ボタン */}
            <button
                onClick={onOpenTemplateModal}
                className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:opacity-80 space-y-1.5 px-4 group"
            >
                <div className="p-2 rounded-xl transition-colors">
                    <FolderTree size={24} className="group-hover:text-[var(--accent-primary)]" />
                </div>
                <span className="text-xs font-medium">{t("template")}</span>
            </button>

            {/* Todo作成ボタン（強調表示） */}
            <div className="relative -mt-12">
                <button
                    onClick={onOpenTodoModal}
                    className={`
                        flex flex-col items-center justify-center bg-white dark:bg-gray-800 border-4 border-gray-100 dark:border-gray-900 rounded-full p-4 shadow-xl transition-all duration-300
                        ${isHighlighted
                            ? "text-orange-500 ring-4 ring-orange-100 dark:ring-orange-900/50 scale-110"
                            : "hover:scale-110 hover:shadow-2xl"}
                    `}
                    style={!isHighlighted ? { color: "var(--accent-primary)" } : undefined}
                >
                    <Plus size={36} strokeWidth={2.5} />
                </button>

                {/* リセットボタン（キープ中のみ表示） */}
                {isHighlighted && onResetKeep && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onResetKeep();
                        }}
                        className="absolute -end-1 top-0 bg-gray-500 text-white rounded-full p-1.5 shadow-md hover:bg-gray-600 transition-colors animate-in zoom-in duration-200"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* アクティビティボタン */}
            <button
                onClick={onOpenActivityModal}
                className="flex flex-col items-center justify-center space-y-1.5 text-gray-500 dark:text-gray-400 hover:opacity-80 transition-colors px-4 group"
            >
                <div className="p-2 rounded-xl transition-colors">
                    <BarChart2 size={24} className="group-hover:text-[var(--accent-primary)]" />
                </div>
                <span className="text-xs font-medium">{t("activity")}</span>
            </button>
        </div>
    );
}
