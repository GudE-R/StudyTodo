"use client";

import React from "react";
import { X, Play, Calendar, Clock, Tag, Repeat, FileText, Flag, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Todo, Category } from "@/types";

interface TodoDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    todo: Todo | null;
    categories: Category[];
    onStartNow: (todo: Todo) => void;
    onDelete: (todoId: string) => void;
}

/**
 * Todo詳細モーダルコンポーネント
 * 
 * Todoの全情報を表示し、タイマー開始への導線を提供します。
 * SRS回数（セッション履歴）も表示します。
 */
export function TodoDetailModal({
    isOpen,
    onClose,
    todo,
    categories,
    onStartNow,
    onDelete
}: TodoDetailModalProps) {
    // このTodoのセッション履歴を取得（SRS回数計算用）
    const sessions = useLiveQuery(
        async () => {
            if (!todo) return [];
            return await db.sessions.where("todoId").equals(todo.id).toArray();
        },
        [todo?.id]
    ) || [];

    if (!isOpen || !todo) return null;

    // カテゴリ名を取得するヘルパー関数
    const getCategoryPath = (categoryId?: string): string => {
        if (!categoryId) return "未設定";

        const findCategory = (id: string, cats: Category[]): Category | null => {
            for (const cat of cats) {
                if (cat.id === id) return cat;
                if (cat.children) {
                    const found = findCategory(id, cat.children);
                    if (found) return found;
                }
            }
            return null;
        };

        const category = findCategory(categoryId, categories);
        return category?.name || "未設定";
    };

    // 優先度の表示名とカラー
    const getPriorityDisplay = (priority?: string) => {
        switch (priority) {
            case "high": return { label: "高", color: "text-red-500 bg-red-50 dark:bg-red-900/30" };
            case "medium": return { label: "中", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30" };
            case "low": return { label: "低", color: "text-green-500 bg-green-50 dark:bg-green-900/30" };
            default: return null;
        }
    };

    // 総学習時間を計算
    const totalDuration = sessions.reduce((acc, s) => acc + s.duration, 0);
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);

    const handleStartNow = () => {
        onStartNow(todo);
        onClose();
    };

    const handleDelete = () => {
        onDelete(todo.id);
        onClose();
    };

    const priority = getPriorityDisplay(todo.priority);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">タスク詳細</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">

                    {/* Title */}
                    <div className="flex items-start space-x-3">
                        {todo.completed ? (
                            <CheckCircle className="text-green-500 mt-0.5" size={24} />
                        ) : (
                            <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-full mt-0.5" />
                        )}
                        <h3 className={`text-xl font-bold ${todo.completed ? "text-gray-400 line-through" : "text-gray-800 dark:text-gray-100"}`}>
                            {todo.title}
                        </h3>
                    </div>

                    {/* Priority Badge */}
                    {priority && (
                        <div className="flex items-center space-x-2">
                            <Flag size={16} className={priority.color.split(" ")[0]} />
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${priority.color}`}>
                                優先度: {priority.label}
                            </span>
                        </div>
                    )}

                    {/* Info Cards */}
                    <div className="space-y-3">

                        {/* Date & Time */}
                        {todo.dueDate && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <Calendar className="text-blue-500" size={20} />
                                <div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {format(new Date(todo.dueDate), "yyyy年M月d日(E)", { locale: ja })}
                                    </div>
                                    {todo.dueTime && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {todo.dueTime}{todo.endTime && ` - ${todo.endTime}`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Category */}
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <Tag className="text-purple-500" size={20} />
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">カテゴリ</div>
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {getCategoryPath(todo.categoryId)}
                                </div>
                            </div>
                        </div>

                        {/* SRS Info */}
                        {todo.srsInterval && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <Repeat className="text-green-500" size={20} />
                                <div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">SRS設定</div>
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                        {todo.srsInterval}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Session Count (SRS回数) */}
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                            <Clock className="text-blue-500" size={20} />
                            <div className="flex-1">
                                <div className="text-xs text-gray-500 dark:text-gray-400">学習履歴</div>
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {sessions.length}回 ({hours > 0 ? `${hours}時間` : ""}{minutes}分)
                                </div>
                            </div>
                        </div>

                        {/* Memo */}
                        {todo.memo && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <div className="flex items-center space-x-2 mb-2">
                                    <FileText className="text-gray-500" size={16} />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">メモ</span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                                    {todo.memo}
                                </p>
                            </div>
                        )}

                        {/* Range */}
                        {todo.range && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">範囲</div>
                                <p className="text-sm text-gray-700 dark:text-gray-200">{todo.range}</p>
                            </div>
                        )}
                    </div>

                    {/* Meta Info */}
                    <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div>作成日: {format(new Date(todo.createdAt), "yyyy/MM/dd HH:mm")}</div>
                        <div>更新日: {format(new Date(todo.updatedAt), "yyyy/MM/dd HH:mm")}</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
                    <button
                        onClick={handleStartNow}
                        className="w-full flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold transition-colors"
                    >
                        <Play size={20} />
                        <span>今すぐ開始</span>
                    </button>
                    <button
                        onClick={handleDelete}
                        className="w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                        このタスクを削除
                    </button>
                </div>
            </div>
        </div>
    );
}
