"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, Plus, Trash2, Folder, FolderOpen, File } from "lucide-react";
import { useTranslations } from "next-intl";
import { Category } from "@studytodo/shared";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { generateId, buildCategoryTree } from "@/lib/utils";

// カラーパレット定義
const CATEGORY_COLORS = [
    "#ef4444", // 赤
    "#f97316", // オレンジ
    "#eab308", // 黄
    "#22c55e", // 緑
    "#14b8a6", // ティール
    "#3b82f6", // 青
    "#8b5cf6", // 紫
    "#ec4899", // ピンク
    "#6b7280", // グレー
];

// const DEFAULT_CATEGORY_COLOR = "#3b82f6"; // 削除：デフォルトは透明（未設定）にする

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
    const [colorPickerId, setColorPickerId] = useState<string | null>(null);
    const colorPickerRef = useRef<HTMLDivElement>(null);

    const t = useTranslations("category");

    const categoriesFlat = useLiveQuery(() => db.categories.orderBy("order").toArray()) || [];
    const categories = buildCategoryTree(categoriesFlat);

    // カラーピッカー外クリック検出
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
                setColorPickerId(null);
            }
        };
        if (colorPickerId) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [colorPickerId]);

    // 色変更ハンドラー
    const handleColorChange = async (categoryId: string, color: string) => {
        try {
            await db.categories.update(categoryId, { color, updatedAt: new Date() });
            setColorPickerId(null);
        } catch (error) {
            console.error("Failed to update category color", error);
        }
    };

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
            alert(t("addFailed"));
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
            alert(t("deleteFailed"));
        }
    };

    const renderInput = () => {
        return (
            <div className="flex items-center space-x-2 ms-8 mt-1">
                <input
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                    placeholder={t("placeholder")}
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === "Enter") confirmAdding();
                        if (e.key === "Escape") cancelAdding();
                    }}
                />
                <button onClick={confirmAdding} className="text-xs font-bold" style={{ color: "var(--accent-primary)" }}>{t("add")}</button>
                <button onClick={cancelAdding} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs">{t("cancel")}</button>
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
                        <li key={node.id} className="ms-4">
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
                                <span className="me-1 text-gray-400 dark:text-gray-500">
                                    {isSmall ? <File size={16} /> : isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                                </span>

                                {/* カラーインジケーター & ピッカー */}
                                <div className="relative mx-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setColorPickerId(node.id);
                                        }}
                                        className={`w-3 h-3 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--accent-primary)] flex items-center justify-center overflow-hidden`}
                                        style={{ backgroundColor: node.color || "transparent" }}
                                        title={t("changeColor")}
                                    >
                                        {!node.color && (
                                            <div className="w-full h-[1px] bg-gray-300 dark:bg-gray-600 rotate-45" />
                                        )}
                                    </button>

                                    {colorPickerId === node.id && (
                                        <div
                                            ref={colorPickerRef}
                                            className="absolute top-6 left-0 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-2 w-max animate-in fade-in zoom-in-95 duration-200"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="grid grid-cols-5 gap-2">
                                                {/* なし（透明）オプション */}
                                                <button
                                                    onClick={() => handleColorChange(node.id, "")}
                                                    className={`w-6 h-6 rounded-full border flex items-center justify-center hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--accent-primary)] ${!node.color || node.color === "" ? "border-gray-600 dark:border-gray-300 ring-2 ring-gray-400 dark:ring-gray-500" : "border-gray-200 dark:border-gray-700"}`}
                                                    title={t("noColor")}
                                                >
                                                    <div className="w-full h-[1px] bg-red-400 rotate-45" />
                                                </button>
                                                {CATEGORY_COLORS.map((color) => (
                                                    <button
                                                        key={color}
                                                        onClick={() => handleColorChange(node.id, color)}
                                                        className={`w-6 h-6 rounded-full border hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--accent-primary)] ${node.color === color ? "border-gray-600 dark:border-gray-300 ring-2 ring-gray-400 dark:ring-gray-500" : "border-transparent"}`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* カテゴリ名 */}
                                <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 font-medium py-1 truncate">
                                    {node.name}
                                </span>

                                {/* アクションボタン (ホバー時表示) */}
                                <div className={`flex items-center space-x-1 transition-opacity ${isDeleting ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                    {!isSmall && !isDeleting && (
                                        <button
                                            onClick={() => startAdding(node.id, node.level === "large" ? "medium" : "small")}
                                            className="p-1 text-gray-400 dark:text-gray-500 hover:text-[var(--accent-primary)]"
                                            title={t("addChildTitle")}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteClick(node.id)}
                                        className={`p-1 transition-colors ${isDeleting ? "text-red-600 bg-red-50 dark:bg-red-900/30 rounded px-2 text-xs font-bold" : "text-gray-400 dark:text-gray-500 hover:text-red-600"}`}
                                        title={t("deleteTitle")}
                                    >
                                        {isDeleting ? t("deleteButton") : <Trash2 size={14} />}
                                    </button>
                                </div>
                            </div>

                            {/* 子要素のレンダリング */}
                            {(isExpanded || isAddingChild) && (
                                <div className="border-s border-gray-100 ms-3">
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
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">{t("treeTitle")}</h3>
                <button
                    onClick={() => startAdding(undefined, "large")}
                    className="flex items-center space-x-1 text-xs px-2 py-1 rounded-md hover:brightness-90"
                    style={{ backgroundColor: "var(--accent-secondary)", color: "var(--accent-primary)" }}
                >
                    <Plus size={12} />
                    <span>{t("addLargeCategory")}</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pe-2">
                {categories.length === 0 && !addingState ? (
                    <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-8 whitespace-pre-wrap">
                        {t("noCategory")}
                    </div>
                ) : (
                    <>
                        {renderTree(categories)}
                        {addingState?.parentId === undefined && addingState !== null && (
                            <div className="ms-4">
                                {renderInput()}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
