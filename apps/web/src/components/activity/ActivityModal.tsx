"use client";

import React, { useState } from "react";
import { X, Clock, Trash2, Calendar } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface ActivityModalProps {
    onClose: () => void;
}

export function ActivityModal({ onClose }: ActivityModalProps) {
    const sessions = useLiveQuery(() => db.sessions.orderBy("createdAt").reverse().toArray()) || [];
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        try {
            await db.sessions.delete(id);
            setDeleteId(null);
        } catch (error) {
            console.error("Failed to delete session", error);
            alert("Failed to delete activity log.");
        }
    };

    const confirmDelete = (id: string) => {
        if (deleteId === id) {
            handleDelete(id);
        } else {
            setDeleteId(id);
            setTimeout(() => setDeleteId(null), 3000);
        }
    }

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m ${s}s`;
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <Clock className="mr-2 text-blue-500" />
                        Activity Log
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {sessions.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            No activity recorded yet.
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group">
                                <div>
                                    <div className="font-medium text-gray-800 dark:text-gray-200">
                                        {session.todoTitle || "Unknown Task"}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                        <Calendar size={12} className="mr-1" />
                                        {format(session.createdAt, "PPP p", { locale: ja })}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                                        {formatDuration(session.duration)}
                                    </span>
                                    <button
                                        onClick={() => confirmDelete(session.id)}
                                        className={`p-1.5 rounded transition-colors ${deleteId === session.id ? "bg-red-100 text-red-600" : "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"}`}
                                        title={deleteId === session.id ? "Click to Confirm" : "Delete"}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
