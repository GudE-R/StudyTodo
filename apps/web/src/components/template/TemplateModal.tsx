"use client";

import React, { useState } from "react";
import { X, FolderTree, Repeat } from "lucide-react";
import { CategoryEditor } from "./CategoryEditor";
import { SRSEditor } from "./SRSEditor";

interface TemplateModalProps {
    onClose: () => void;
}

export function TemplateModal({ onClose }: TemplateModalProps) {
    const [activeTab, setActiveTab] = useState<"category" | "srs">("category");

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Templates & Categories</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex border-b border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab("category")}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${activeTab === "category" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}
                    >
                        <FolderTree size={18} />
                        <span>Categories</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("srs")}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors ${activeTab === "srs" ? "border-purple-500 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}
                    >
                        <Repeat size={18} />
                        <span>SRS Profiles</span>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden p-4 flex flex-col">
                    {activeTab === "category" ? (
                        <CategoryEditor />
                    ) : (
                        <SRSEditor onClose={() => { }} />
                    )}
                </div>
            </div>
        </div>
    );
}
