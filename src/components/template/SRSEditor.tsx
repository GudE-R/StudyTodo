"use client";

import React, { useState } from "react";
import { Plus, Trash2, TrendingUp, Calendar } from "lucide-react";
import { SRSProfile } from "@/types";

interface SRSEditorProps {
    profiles: SRSProfile[];
    onChange: (profiles: SRSProfile[]) => void;
}

/**
 * SRS（忘却曲線）設定エディタ
 * 
 * 復習間隔のプリセットを管理します。
 */
export function SRSEditor({ profiles, onChange }: SRSEditorProps) {
    const handleAddProfile = () => {
        const name = prompt("設定名を入力してください（例: 短期集中）");
        if (!name) return;

        const intervalsStr = prompt("復習間隔をカンマ区切りで入力してください（例: 1,3,7）");
        if (!intervalsStr) return;

        const intervals = intervalsStr.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (intervals.length === 0) {
            alert("有効な数値が入力されませんでした");
            return;
        }

        const newProfile: SRSProfile = {
            id: crypto.randomUUID(),
            name,
            intervals,
            isDefault: false,
        };

        onChange([...profiles, newProfile]);
    };

    const handleDelete = (id: string) => {
        if (!confirm("この設定を削除しますか？")) return;
        onChange(profiles.filter(p => p.id !== id));
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-500">SRS設定リスト</h3>
                <button
                    onClick={handleAddProfile}
                    className="flex items-center space-x-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-100"
                >
                    <Plus size={12} />
                    <span>新規作成</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {profiles.map((profile) => (
                    <div key={profile.id} className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                {profile.isDefault ? (
                                    <TrendingUp size={16} className="text-orange-500" />
                                ) : (
                                    <Calendar size={16} className="text-blue-500" />
                                )}
                                <span className="font-bold text-gray-700">{profile.name}</span>
                                {profile.isDefault && (
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">デフォルト</span>
                                )}
                            </div>
                            {!profile.isDefault && (
                                <button
                                    onClick={() => handleDelete(profile.id)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-1">
                            {profile.intervals.map((days, i) => (
                                <span key={i} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-md border border-gray-100">
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
