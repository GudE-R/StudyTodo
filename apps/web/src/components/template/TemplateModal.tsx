"use client";

import React, { useState } from "react";
import { X, FolderTree, Repeat } from "lucide-react";
import { useTranslations } from "next-intl";
import { CategoryEditor } from "./CategoryEditor";
import { SRSEditor } from "./SRSEditor";

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TemplateModal({
    isOpen,
    onClose,
}: TemplateModalProps) {
    const t = useTranslations("template");

    const [activeTab, setActiveTab] = useState<"category" | "srs" | "theme">("category");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t("title")}</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 dark:border-gray-800">
                    <button
                        onClick={() => setActiveTab("category")}
                        className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-bold transition-colors relative ${activeTab === "category" ? "text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            }`}
                    >
                        <FolderTree size={18} />
                        <span>{t("categoryTab")}</span>
                        {activeTab === "category" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("srs")}
                        className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-bold transition-colors relative ${activeTab === "srs" ? "text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            }`}
                    >
                        <Repeat size={18} />
                        <span>{t("srsTab")}</span>
                        {activeTab === "srs" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden p-4 bg-gray-50/50 dark:bg-gray-900">
                    {activeTab === "category" && <CategoryEditor />}
                    {activeTab === "srs" && <SRSEditor />}
                </div>
            </div>
        </div>
    );
}
