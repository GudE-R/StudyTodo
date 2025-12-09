"use client";

import React, { useState, ReactNode } from "react";
import { X, Maximize2 } from "lucide-react";

interface ExpandablePaneProps {
    title: string;
    children: ReactNode;
    className?: string;
}

/**
 * 拡大可能なペインコンポーネント
 * 
 * モバイル端末でタップすると全画面表示になります。
 * 閉じるボタンで元のサイズに戻ります。
 */
export function ExpandablePane({ title, children, className = "" }: ExpandablePaneProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (isExpanded) {
        return (
            <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col animate-in fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h2>
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                    >
                        <X size={24} />
                    </button>
                </div>
                {/* Content */}
                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {/* 拡大ボタン（モバイルのみ表示） */}
            <button
                onClick={() => setIsExpanded(true)}
                className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 sm:hidden"
            >
                <Maximize2 size={16} />
            </button>
            {children}
        </div>
    );
}
