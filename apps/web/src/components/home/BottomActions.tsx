"use client";

import { LayoutTemplate, Plus, X, BarChart2 } from "lucide-react";
import React from "react";

interface BottomActionsProps {
    onOpenSRSEditor: () => void;
    onOpenCategoryEditor: () => void;
    onOpenAuth: () => void;
    onOpenActivity: () => void;
}

export function BottomActions({ onOpenSRSEditor, onOpenCategoryEditor, onOpenAuth, onOpenActivity }: BottomActionsProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end space-y-4">

            {/* Menu Items */}
            <div className={`flex flex-col items-end space-y-3 transition-all duration-300 ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}>
                <button
                    onClick={() => { onOpenCategoryEditor(); setIsOpen(false); }}
                    className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 pr-4 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <div className="bg-orange-100 text-orange-600 p-2 rounded-full">
                        <LayoutTemplate size={20} />
                    </div>
                    <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">Category / Templates</span>
                </button>

                <button
                    onClick={() => { onOpenActivity(); setIsOpen(false); }}
                    className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 pr-4 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                        <BarChart2 size={20} />
                    </div>
                    <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">Activity Log</span>
                </button>
            </div>

            {/* Main Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-center w-16 h-16 rounded-full shadow-xl transition-all duration-300 ${isOpen ? "bg-gray-800 dark:bg-white text-white dark:text-gray-800 rotate-45" : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"}`}
            >
                <Plus size={32} />
            </button>
        </div>
    );
}
