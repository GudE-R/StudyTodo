"use client";

import React, { useState } from "react";
import { Plus, Trash2, TrendingUp, Calendar } from "lucide-react";
import { SRSProfile } from "@pomarc/shared";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { generateId } from "@/lib/utils";

/**
 * SRS（忘却曲線）設定エディタ
 * 
 * 復習間隔のプリセットを管理します。
 */
export function SRSEditor() {
    const profiles = useLiveQuery(() => db.srsProfiles.toArray()) || [];
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState("");
    const [newIntervals, setNewIntervals] = useState("");

    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const startAdding = () => {
        setIsAdding(true);
        setNewName("");
        setNewIntervals("");
    };

    const cancelAdding = () => {
        setIsAdding(false);
        setNewName("");
        setNewIntervals("");
    };

    const confirmAdding = async () => {
        if (!newName.trim() || !newIntervals.trim()) return;

        const intervals = newIntervals.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (intervals.length === 0) {
            alert("有効な数値が入力されませんでした");
            return;
        }

        try {
            const newProfile: SRSProfile = {
                id: generateId(),
                name: newName.trim(),
                intervals,
                isDefault: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await db.srsProfiles.add(newProfile);
            setIsAdding(false);
            setNewName("");
            setNewIntervals("");
        } catch (error) {
            console.error("Failed to add SRS profile", error);
            alert("SRS設定の追加に失敗しました");
        }
    };

    const handleDeleteClick = (id: string) => {
        if (deleteConfirmId === id) {
            executeDelete(id);
        } else {
            setDeleteConfirmId(id);
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };

    const executeDelete = async (id: string) => {
        try {
            await db.srsProfiles.delete(id);
            setDeleteConfirmId(null);
        } catch (error) {
            console.error("Failed to delete SRS profile", error);
            alert("SRS設定の削除に失敗しました");
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">SRS設定リスト</h3>
                {!isAdding && (
                    <button
                        onClick={startAdding}
                        className="flex items-center space-x-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50"
                    >
                        <Plus size={12} />
                        <span>新規作成</span>
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {isAdding && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-lg p-3 mb-3">
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                                placeholder="設定名（例: 短期集中）"
                                autoFocus
                            />
                            <input
                                type="text"
                                value={newIntervals}
                                onChange={(e) => setNewIntervals(e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                                placeholder="復習間隔（例: 1, 3, 7）"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") confirmAdding();
                                    if (e.key === "Escape") cancelAdding();
                                }}
                            />
                            <div className="flex justify-end space-x-2 mt-2">
                                <button onClick={cancelAdding} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">キャンセル</button>
                                <button onClick={confirmAdding} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">保存</button>
                            </div>
                        </div>
                    </div>
                )}

                {profiles.map((profile) => (
                    <div key={profile.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                {profile.isDefault ? (
                                    <TrendingUp size={16} className="text-orange-500" />
                                ) : (
                                    <Calendar size={16} className="text-blue-500" />
                                )}
                                <span className="font-bold text-gray-700 dark:text-gray-200">{profile.name}</span>
                                {profile.isDefault && (
                                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">デフォルト</span>
                                )}
                            </div>
                            {!profile.isDefault && (
                                <button
                                    onClick={() => handleDeleteClick(profile.id)}
                                    className={`transition-colors ${deleteConfirmId === profile.id ? "text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded text-xs font-bold" : "text-gray-400 dark:text-gray-500 hover:text-red-500"}`}
                                >
                                    {deleteConfirmId === profile.id ? "削除する" : <Trash2 size={16} />}
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-1">
                            {profile.intervals.map((days, i) => (
                                <span key={i} className="text-xs bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-600">
                                    {days}日後
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
