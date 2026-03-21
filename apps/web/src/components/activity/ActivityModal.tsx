"use client";

import React, { useState } from "react";
import { X, BarChart2, History } from "lucide-react";
import { Session, Todo, Category } from "@studytodo/shared";
import { useTranslations } from "next-intl";
import { AnalyticsTab } from "./AnalyticsTab";
import { HistoryTab } from "./HistoryTab";


interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessions: Session[];
    todos: Todo[];
    onDeleteTodo: (todoId: string) => void;
    onBulkDelete: (ids: string[]) => Promise<void>;
    categories: Category[];
    onOpenTodoDetail: (todo: Todo) => void;
}

type Tab = "analytics" | "history";

export function ActivityModal({ isOpen, onClose, sessions, todos, onDeleteTodo, onBulkDelete, categories, onOpenTodoDetail }: ActivityModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>("analytics");

    const t = useTranslations("activity");

    // Flatten categories for dropdown
    const flattenCategories = (cats: Category[]): Category[] => {
        let flat: Category[] = [];
        cats.forEach(c => {
            flat.push(c);
            if (c.children) {
                flat = [...flat, ...flattenCategories(c.children)];
            }
        });
        return flat;
    };
    const flatCategories = flattenCategories(categories);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity p-4">
            <div className="w-full max-w-4xl h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setActiveTab("analytics")}
                            className={`flex items-center space-x-2 pb-2 border-b-2 transition-colors ${activeTab === "analytics" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
                        >
                            <BarChart2 size={18} />
                            <span className="text-sm font-bold">{t("analytics")}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`flex items-center space-x-2 pb-2 border-b-2 transition-colors ${activeTab === "history" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
                        >
                            <History size={18} />
                            <span className="text-sm font-bold">{t("history")}</span>
                        </button>

                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-800/50 p-6 min-h-0">
                    {activeTab === "analytics" ? (
                        <AnalyticsTab sessions={sessions} todos={todos} flatCategories={flatCategories} />
                    ) : (
                        <HistoryTab todos={todos} flatCategories={flatCategories} onDeleteTodo={onDeleteTodo} onBulkDelete={onBulkDelete} onOpenTodoDetail={onOpenTodoDetail} />
                    )}
                </div>
            </div>
        </div>
    );
}
