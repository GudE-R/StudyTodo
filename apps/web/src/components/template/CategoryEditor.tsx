"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Trash2, Folder, FolderOpen, File } from "lucide-react";
import { Category } from "@/types";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { generateId, buildCategoryTree } from "@/lib/utils";

/**
 * カテゴリ編集コンポーネント
 * 
 * 大・中・小の3階層のカテゴリをツリー形式で管理します。
 */
export function CategoryEditor() {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [addingState, setAddingState] = useState<{ parentId: string | undefined, level: "large" | "medium" | "small" } | null>(null);
    const [inputName, setInputName] = useState("");

    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const categoriesFlat = useLiveQuery(() => db.categories.orderBy("order").toArray()) || [];
    const categories = buildCategoryTree(categoriesFlat);

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    const startAdding = (parentId: string | undefined, level: "large" | "medium" | "small") => {
        setAddingState({ parentId, level });
        setInputName("");
        if (parentId) {
            const newExpanded = new Set(expandedIds);
            newExpanded.add(parentId);
            setExpandedIds(newExpanded);
        }
    };

    const cancelAdding = () => {
        setAddingState(null);
        setInputName("");
    };

    const confirmAdding = async () => {
        if (!inputName.trim() || !addingState) return;

        try {
            const newCategory: Category = {
                id: generateId(),
                name: inputName.trim(),
                level: addingState.level,
                parentId: addingState.parentId,
                order: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                children: [],
            };

            await db.categories.add(newCategory);
            setAddingState(null);
            setInputName("");
        } catch (error) {
            console.error("Failed to add category", error);
            alert("カテゴリの追加に失敗しました");
        }
    };

    const handleDeleteClick = (id: string) => {
        if (deleteConfirmId === id) {
            // 2回目のクリックで削除実行
            executeDelete(id);
        } else {
            // 1回目のクリックで確認状態へ
            setDeleteConfirmId(id);
            // 3秒後にリセット（オプション）
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };

    const executeDelete = async (id: string) => {
        try {
            // 再帰的に削除対象のIDを収集
            const idsToDelete: string[] = [];
            const collectIds = (catId: string) => {
                idsToDelete.push(catId);
                const children = categoriesFlat.filter(c => c.parentId === catId);
                children.forEach(child => collectIds(child.id));
            };
            collectIds(id);

            await db.categories.bulkDelete(idsToDelete);
            setDeleteConfirmId(null);
        } catch (error) {
            console.error("Failed to delete category", error);
            alert("カテゴリの削除に失敗しました");
        }
    };

    const renderInput = () => {
        return (
            <div className="flex items-center space-x-2 ml-8 mt-1">
                <input
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="カテゴリ名"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === "Enter") confirmAdding();
                        if (e.key === "Escape") cancelAdding();
                    }}
                />
                <button onClick={confirmAdding} className="text-blue-600 hover:text-blue-800 text-xs font-bold">追加</button>
                <button onClick={cancelAdding} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs">キャンセル</button>
            </div>
        );
    };

    const renderTree = (nodes: Category[]) => {
        return (
            <ul className="space-y-1">
                {nodes.map((node) => {
                    const isExpanded = expandedIds.has(node.id);

                    const isSmall = node.level === "small";
                    const isAddingChild = addingState?.parentId === node.id;
                    const isDeleting = deleteConfirmId === node.id;

                    return (
                        <li key={node.id} className="ml-4">
                            <div className="flex items-center group">
                                {/* 展開トグルボタン */}
                                {!isSmall ? (
                                    <button
                                        onClick={() => toggleExpand(node.id)}
                                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>
                                ) : (
                                    <span className="w-6" />
                                )}

                                {/* アイコン */}
                                <span className="mr-2 text-blue-500">
                                    {isSmall ? <File size={16} /> : isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                                </span>

                                {/* カテゴリ名 */}
                                <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 font-medium py-1">
                                    {node.name}
                                </span>

                                {/* アクションボタン (ホバー時表示) */}
                                <div className={`flex items-center space-x-1 transition-opacity ${isDeleting ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                    {!isSmall && !isDeleting && (
                                        <button
                                            onClick={() => startAdding(node.id, node.level === "large" ? "medium" : "small")}
                                            className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600"
                                            title="子カテゴリを追加"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteClick(node.id)}
                                        className={`p-1 transition-colors ${isDeleting ? "text-red-600 bg-red-50 dark:bg-red-900/30 rounded px-2 text-xs font-bold" : "text-gray-400 dark:text-gray-500 hover:text-red-600"}`}
                                        title="削除"
                                    >
                                        {isDeleting ? "削除する" : <Trash2 size={14} />}
                                    </button>
                                </div>
                            </div>

                            {/* 子要素のレンダリング */}
                            {(isExpanded || isAddingChild) && (
                                <div className="border-l border-gray-100 ml-3">
                                    {isExpanded && node.children && renderTree(node.children)}
                                    {isAddingChild && renderInput()}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        );
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">カテゴリ構成</h3>
                <button
                    onClick={() => startAdding(undefined, "large")}
                    className="flex items-center space-x-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50"
                >
                    <Plus size={12} />
                    <span>大カテゴリ追加</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {categories.length === 0 && !addingState ? (
                    <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
                        カテゴリがありません。<br />
                        「大カテゴリ追加」から作成してください。
                    </div>
                ) : (
                    <>
                        {renderTree(categories)}
                        {addingState?.parentId === undefined && addingState !== null && (
                            <div className="ml-4">
                                {renderInput()}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
