"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Trash2, Folder, Check } from "lucide-react";
import { Category, generateId } from "@pomarc/shared";
import { useCategories } from "@/hooks/domain/useCategories";

interface CategoryEditorProps {
    // optional props if needed
}

export function CategoryEditor({ }: CategoryEditorProps) {
    const {
        categories,
        categoryTree,
        addCategory,
        updateCategory,
        deleteCategory
    } = useCategories();

    // Local state for UI
    const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

    // Adding state
    const [addingState, setAddingState] = useState<{ parentId: string | null } | null>(null);
    const [inputName, setInputName] = useState("");

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(openCategories);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setOpenCategories(newExpanded);
    };

    const startAdding = (parentId: string | null) => {
        setAddingState({ parentId });
        setInputName("");
        if (parentId) {
            const newExpanded = new Set(openCategories);
            newExpanded.add(parentId);
            setOpenCategories(newExpanded);
        }
    };

    const cancelAdding = () => {
        setAddingState(null);
        setInputName("");
    };

    const confirmAdding = async () => {
        if (!inputName.trim()) return;
        try {
            await addCategory({
                id: generateId(),
                name: inputName.trim(),
                parentId: addingState?.parentId || undefined,
                level: "medium", // Default
                order: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            setAddingState(null);
            setInputName("");
        } catch (error) {
            console.error("Failed to add category", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this category and all sub-categories?")) return;
        // Cascade delete logic would be needed here ideally, but for now simple delete
        // Implementing simple cascade delete for this ID's subtree
        // Cascade delete logic using in-memory categories
        const deleteRecursive = async (catId: string) => {
            const children = categories.filter(c => c.parentId === catId);
            for (const child of children) {
                await deleteRecursive(child.id);
            }
            await deleteCategory(catId);
        };

        try {
            await deleteRecursive(id);
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const renderNode = (node: Category, level: number = 0) => {
        const isExpanded = openCategories.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isAddingHere = addingState && addingState.parentId === node.id;

        return (
            <div key={node.id} className="select-none">
                <div
                    className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg group"
                    style={{ paddingLeft: `${level * 16 + 8} px` }}
                >
                    <button
                        onClick={() => toggleExpand(node.id)}
                        className={`p - 1 mr - 1 text - gray - 400 hover: text - gray - 600 dark: hover: text - gray - 300 ${hasChildren ? "" : "invisible"} `}
                    >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <Folder size={18} className="text-blue-500 mr-2" />
                    <span className="flex-1 font-medium text-gray-700 dark:text-gray-200">{node.name}</span>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                        <button
                            onClick={() => startAdding(node.id)}
                            className="p-1 text-gray-400 hover:text-blue-500"
                            title="Add Subcategory"
                        >
                            <Plus size={16} />
                        </button>
                        <button
                            onClick={() => handleDelete(node.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {isExpanded && (
                    <div>
                        {node.children?.map(child => renderNode(child, level + 1))}
                        {isAddingHere && (
                            <div className="flex items-center p-2" style={{ paddingLeft: `${(level + 1) * 16 + 8} px` }}>
                                <input
                                    autoFocus
                                    type="text"
                                    value={inputName}
                                    onChange={e => setInputName(e.target.value)}
                                    placeholder="Category Name"
                                    className="flex-1 text-sm border-b border-blue-500 bg-transparent outline-none mr-2"
                                    onKeyDown={e => { if (e.key === "Enter") confirmAdding(); else if (e.key === "Escape") cancelAdding(); }}
                                />
                                <button onClick={confirmAdding} className="text-green-500 mr-1"><Check size={16} /></button>
                                <button onClick={cancelAdding} className="text-red-500"><Plus size={16} className="rotate-45" /></button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex-1 overflow-y-auto min-h-[300px]">
            <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Categories</span>
                <button
                    onClick={() => startAdding(null)}
                    className="flex items-center space-x-1 text-blue-600 text-sm font-medium hover:underline"
                >
                    <Plus size={16} />
                    <span>New Root</span>
                </button>
            </div>

            {addingState && addingState.parentId === null && (
                <div className="flex items-center p-2 mb-2 bg-gray-50 dark:bg-gray-700/30 rounded">
                    <input
                        autoFocus
                        type="text"
                        value={inputName}
                        onChange={e => setInputName(e.target.value)}
                        placeholder="Root Category Name"
                        className="flex-1 text-sm bg-transparent outline-none mr-2"
                        onKeyDown={e => { if (e.key === "Enter") confirmAdding(); else if (e.key === "Escape") cancelAdding(); }}
                    />
                    <button onClick={confirmAdding} className="text-green-500 mr-1"><Check size={16} /></button>
                    <button onClick={cancelAdding} className="text-red-500"><Plus size={16} className="rotate-45" /></button>
                </div>
            )}

            <div className="pb-10">
                {categories.map(cat => renderNode(cat))}
                {categories.length === 0 && !addingState && (
                    <div className="text-center text-gray-400 text-sm py-10">
                        No categories yet. Create one!
                    </div>
                )}
            </div>
        </div>
    );
}
