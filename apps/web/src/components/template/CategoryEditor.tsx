"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Trash2, Folder, FolderOpen, File } from "lucide-react";
import { Category } from "@pomarc/shared";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { generateId, buildCategoryTree } from "@pomarc/shared";

/**
 * 繧ｫ繝・ざ繝ｪ邱ｨ髮・さ繝ｳ繝昴・繝阪Φ繝・
 * 
 * 螟ｧ繝ｻ荳ｭ繝ｻ蟆上・3髫主ｱ､縺ｮ繧ｫ繝・ざ繝ｪ繧偵ヤ繝ｪ繝ｼ蠖｢蠑上〒邂｡逅・＠縺ｾ縺吶・
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
            alert("Failed to add category.");
        }
    };

    const handleDeleteClick = (id: string) => {
        if (deleteConfirmId === id) {
            // Confirm deletion on second click
            executeDelete(id);
        } else {
            // First click sets confirmation state
            setDeleteConfirmId(id);
            // Reset confirmation after 3 seconds
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };

    const executeDelete = async (id: string) => {
        try {
            // Collect all IDs to delete, including children
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
            alert("Failed to delete category.");
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
                    placeholder="Category Name"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === "Enter") confirmAdding();
                        if (e.key === "Escape") cancelAdding();
                    }}
                />
                <button onClick={confirmAdding} className="text-blue-600 hover:text-blue-800 text-xs font-bold">Add</button>
                <button onClick={cancelAdding} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs">Cancel</button>
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
                                {/* Expand/collapse button */}
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

                                {/* Icon */}
                                <span className="mr-2 text-blue-500">
                                    {isSmall ? <File size={16} /> : isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                                </span>

                                {/* Category name */}
                                <span className="flex-1 text-sm text-gray-700 dark:text-gray-200 font-medium py-1">
                                    {node.name}
                                </span>

                                {/* Action buttons (visible on hover) */}
                                <div className={`flex items-center space-x-1 transition-opacity ${isDeleting ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                    {!isSmall && !isDeleting && (
                                        <button
                                            onClick={() => startAdding(node.id, node.level === "large" ? "medium" : "small")}
                                            className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600"
                                            title="Add sub-category"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteClick(node.id)}
                                        className={`p-1 transition-colors ${isDeleting ? "text-red-600 bg-red-50 dark:bg-red-900/30 rounded px-2 text-xs font-bold" : "text-gray-400 dark:text-gray-500 hover:text-red-600"}`}
                                        title="Delete"
                                    >
                                        {isDeleting ? "Delete" : <Trash2 size={14} />}
                                    </button>
                                </div>
                            </div>

                            {/* Child elements container */}
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
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">Categories</h3>
                <button
                    onClick={() => startAdding(undefined, "large")}
                    className="flex items-center space-x-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50"
                >
                    <Plus size={12} />
                    <span>Add Large Category</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {categories.length === 0 && !addingState ? (
                    <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
                        No categories.
                        Click "Add Large Category" to get started.
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
