"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Flag, Clock, Trash2, Save } from "lucide-react";
import { Todo, Category, SRSProfile } from "@pomarc/shared";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { format } from "date-fns";

interface TodoDetailModalProps {
    todo: Todo;
    onClose: () => void;
    onUpdate?: (updates: Partial<Todo>) => void;
    onDelete?: () => void;
}

export function TodoDetailModal({ todo, onClose, onUpdate, onDelete }: TodoDetailModalProps) {
    const [title, setTitle] = useState(todo.title);
    const [memo, setMemo] = useState(todo.memo || "");
    const [priority, setPriority] = useState(todo.priority || "medium");

    // For editing logic usually we want to save on close or specific button
    const handleSave = async () => {
        if (!todo.id) return;
        try {
            await db.todos.update(todo.id, {
                title,
                memo,
                priority,
                updatedAt: new Date()
            });
            onClose();
        } catch (error) {
            console.error("Failed to update todo", error);
            alert("Failed to save changes.");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        if (!todo.id) return;
        try {
            await db.todos.delete(todo.id);
            if (onDelete) onDelete();
            onClose();
        } catch (error) {
            console.error("Failed to delete todo", error);
            alert("Failed to delete task.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Task Details</h2>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleDelete} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-full">
                            <Trash2 size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full text-lg font-bold border-b-2 border-transparent focus:border-blue-500 outline-none bg-transparent"
                        />
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Priority</label>
                        <div className="flex space-x-2">
                            {(["high", "medium", "low"] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${priority === p ?
                                        (p === "high" ? "bg-red-100 text-red-600" : p === "medium" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600")
                                        : "bg-gray-100 text-gray-500"}`}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Memo */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Memo</label>
                        <textarea
                            value={memo}
                            onChange={e => setMemo(e.target.value)}
                            rows={5}
                            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Add notes..."
                        />
                    </div>

                    {/* Meta Info */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 space-y-1">
                        <div>Created: {todo.createdAt ? format(new Date(todo.createdAt), "PPP") : "-"}</div>
                        <div>ID: {todo.id}</div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={handleSave}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center space-x-2 transition-colors"
                    >
                        <Save size={20} />
                        <span>Save Changes</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
