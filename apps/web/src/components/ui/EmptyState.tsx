"use client";

import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

/**
 * EmptyState Component
 * データがない場合のプレースホルダー表示。
 * リスト、テーブル、カード領域で使用。
 */
export function EmptyState({
    icon,
    title,
    description,
    action,
    className = ""
}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
            <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
                {icon || <Inbox className="w-8 h-8" />}
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                    {description}
                </p>
            )}
            {action && (
                <div className="mt-4">
                    {action}
                </div>
            )}
        </div>
    );
}
