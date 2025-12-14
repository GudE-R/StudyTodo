"use client";

import React, { useState } from "react";
import { X, Calendar, Flag, Send } from "lucide-react";
import { Category, generateId } from "@pomarc/shared";
import { useTodos } from "@/hooks/domain/useTodos";

interface TodoCreateModalProps {
    onClose: () => void;
    categories: Category[];
}

export function TodoCreateModal({ onClose, categories }: TodoCreateModalProps) {
    const { addTodo } = useTodos(); // No date filter needed for creation usually, or pass undefined
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState<string>("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [dueDate, setDueDate] = useState<string>("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        try {
            await addTodo({
                id: generateId(),
                title,
                categoryId: categoryId || undefined,
                priority,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                completed: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                // srsLevel and nextReviewDate removed as they are not in shared Todo type
                // srsInterval: undefined, // Add if needed
                srsGroupId: undefined
            });
            onClose();
        } catch (error) {
            console.error("Failed to add todo", error);
            alert("Failed to create task.");
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50 p-4 max-w-lg mx-auto border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-700 dark:text-gray-200">New Task</h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="w-full text-lg p-2 border-b-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 bg-transparent outline-none"
                    autoFocus
                />

                <div className="flex items-center space-x-4 overflow-x-auto pb-2">
                    {/* Category Select */}
                    <select
                        value={categoryId}
                        onChange={e => setCategoryId(e.target.value)}
                        className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-sm border-none outline-none"
                    >
                        <option value="">No Category</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    {/* Due Date */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1.5">
                        <Calendar size={16} className="text-gray-500 mr-2" />
                        <input
                            type="datetime-local"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            className="bg-transparent text-sm outline-none w-32"
                        />
                    </div>

                    {/* Priority */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-1 py-1">
                        {(["low", "medium", "high"] as const).map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className={`p-1 rounded-full ${priority === p ?
                                    (p === "high" ? "bg-red-500 text-white" : p === "medium" ? "bg-orange-500 text-white" : "bg-blue-500 text-white")
                                    : "text-gray-400"}`}
                                title={p}
                            >
                                <Flag size={14} fill="currentColor" />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={!title.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-transform hover:scale-105"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
}
