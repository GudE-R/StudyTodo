"use client";

import React, { useState } from "react";
import { Plus, Trash2, TrendingUp, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { SRSProfile } from "@studytodo/shared";
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

    const t = useTranslations("srs");
    const tc = useTranslations("common");

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
            alert(t("invalidInput"));
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
            alert(t("addFailed"));
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
            alert(t("deleteFailed"));
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">{t("listTitle")}</h3>
                {!isAdding && (
                    <button
                        onClick={startAdding}
                        className="flex items-center space-x-1 text-xs px-2 py-1 rounded-md hover:brightness-90"
                        style={{ backgroundColor: "var(--accent-secondary)", color: "var(--accent-primary)" }}
                    >
                        <Plus size={12} />
                        <span>{t("createNew")}</span>
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {isAdding && (
                    <div className="border rounded-lg p-3 mb-3" style={{ backgroundColor: "var(--accent-secondary)", borderColor: "var(--accent-secondary)" }}>
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                                placeholder={t("namePlaceholder")}
                                autoFocus
                            />
                            <input
                                type="text"
                                value={newIntervals}
                                onChange={(e) => setNewIntervals(e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded px-2 py-1 text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                                placeholder={t("intervalPlaceholder")}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") confirmAdding();
                                    if (e.key === "Escape") cancelAdding();
                                }}
                            />
                            <div className="flex justify-end space-x-2 mt-2">
                                <button onClick={cancelAdding} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">{tc("cancel")}</button>
                                <button onClick={confirmAdding} className="text-xs text-white px-3 py-1 rounded hover:brightness-90" style={{ backgroundColor: "var(--accent-primary)" }}>{tc("save")}</button>
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
                                    <Calendar size={16} style={{ color: "var(--accent-primary)" }} />
                                )}
                                <span className="font-bold text-gray-700 dark:text-gray-200">{profile.isDefault ? t("defaultProfileName") : profile.name}</span>
                                {profile.isDefault && (
                                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">{t("defaultBadge")}</span>
                                )}
                            </div>
                            <button
                                onClick={() => handleDeleteClick(profile.id)}
                                className={`transition-colors ${deleteConfirmId === profile.id ? "text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded text-xs font-bold" : "text-gray-400 dark:text-gray-500 hover:text-red-500"}`}
                            >
                                {deleteConfirmId === profile.id ? t("deleteButton") : <Trash2 size={16} />}
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-1">
                            {profile.intervals.map((days, i) => (
                                <span key={i} className="text-xs bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-600">
                                    {t("daysAfter", { days })}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
