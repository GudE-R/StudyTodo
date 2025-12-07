"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Trash2, Edit2, Folder, FolderOpen, File } from "lucide-react";
import { Category } from "@/types";

interface CategoryEditorProps {
    categories: Category[];
    onChange: (categories: Category[]) => void;
}

/**
 * カテゴリ編集コンポーネント
 * 
 * 大・中・小の3階層のカテゴリをツリー形式で管理します。
 */
export function CategoryEditor({ categories, onChange }: CategoryEditorProps) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    const handleAddCategory = (parentId: string | undefined, level: "large" | "medium" | "small") => {
        const name = prompt("カテゴリ名を入力してください");
        if (!name) return;

        const newCategory: Category = {
            id: crypto.randomUUID(),
            name,
            level,
            parentId,
            children: [],
        };

        if (!parentId) {
            // 大カテゴリの追加
            onChange([...categories, newCategory]);
        } else {
            // 子カテゴリの追加（再帰的に検索して追加）
            const addRecursive = (cats: Category[]): Category[] => {
                return cats.map((cat) => {
                    if (cat.id === parentId) {
                        return { ...cat, children: [...(cat.children || []), newCategory] };
                    }
                    if (cat.children) {
                        return { ...cat, children: addRecursive(cat.children) };
                    }
                    return cat;
                });
            };
            onChange(addRecursive(categories));
            // 親フォルダを自動展開
            const newExpanded = new Set(expandedIds);
            newExpanded.add(parentId);
            setExpandedIds(newExpanded);
        }
    };

    const handleDelete = (id: string) => {
        if (!confirm("このカテゴリと子カテゴリを削除しますか？")) return;

        const deleteRecursive = (cats: Category[]): Category[] => {
            return cats.filter((cat) => cat.id !== id).map((cat) => ({
                ...cat,
                children: cat.children ? deleteRecursive(cat.children) : [],
            }));
        };
        onChange(deleteRecursive(categories));
    };

    const renderTree = (nodes: Category[]) => {
        return (
            <ul className="space-y-1">
                {nodes.map((node) => {
                    const isExpanded = expandedIds.has(node.id);
                    const hasChildren = node.children && node.children.length > 0;
                    const isSmall = node.level === "small";

                    return (
                        <li key={node.id} className="ml-4">
                            <div className="flex items-center group">
                                {/* 展開トグルボタン */}
                                {!isSmall ? (
                                    <button
                                        onClick={() => toggleExpand(node.id)}
                                        className="p-1 text-gray-400 hover:text-gray-600"
                                    >
                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>
                                ) : (
                                    <span className="w-6" /> // インデント調整
                                )}

                                {/* アイコン */}
                                <span className="mr-2 text-blue-500">
                                    {isSmall ? <File size={16} /> : isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                                </span>

                                {/* カテゴリ名 */}
                                <span className="flex-1 text-sm text-gray-700 font-medium py-1">
                                    {node.name}
                                </span>

                                {/* アクションボタン (ホバー時表示) */}
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!isSmall && (
                                        <button
                                            onClick={() => handleAddCategory(node.id, node.level === "large" ? "medium" : "small")}
                                            className="p-1 text-gray-400 hover:text-blue-600"
                                            title="子カテゴリを追加"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(node.id)}
                                        className="p-1 text-gray-400 hover:text-red-600"
                                        title="削除"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* 子要素のレンダリング */}
                            {isExpanded && node.children && (
                                <div className="border-l border-gray-100 ml-3">
                                    {renderTree(node.children)}
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
                <h3 className="text-sm font-bold text-gray-500">カテゴリ構成</h3>
                <button
                    onClick={() => handleAddCategory(undefined, "large")}
                    className="flex items-center space-x-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-100"
                >
                    <Plus size={12} />
                    <span>大カテゴリ追加</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {categories.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">
                        カテゴリがありません。<br />
                        「大カテゴリ追加」から作成してください。
                    </div>
                ) : (
                    renderTree(categories)
                )}
            </div>
        </div>
    );
}
