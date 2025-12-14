"use client";

import React, { useState } from "react";
import { Trash2, Plus, Info, Repeat } from "lucide-react";
import { generateId, SRSProfile } from "@pomarc/shared";
import { useSRSProfiles } from "@/hooks/domain/useSRSProfiles";

interface SRSEditorProps {
    onClose: () => void;
}

export function SRSEditor({ onClose }: SRSEditorProps) {
    const { srsProfiles: profiles, addSRSProfile, deleteSRSProfile, updateSRSProfile } = useSRSProfiles();
    const [name, setName] = useState("");
    const [intervals, setIntervals] = useState("1, 3, 7, 14, 30");

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const intervalArray = intervals
            .split(",")
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n) && n > 0);

        if (intervalArray.length === 0) {
            alert("Please enter valid intervals (comma separated numbers).");
            return;
        }

        try {
            await addSRSProfile({
                id: generateId(),
                name,
                intervals: intervalArray,
                isDefault: profiles.length === 0, // Make default if first one
                createdAt: new Date(),
                updatedAt: new Date()
            });
            setName("");
            setIntervals("1, 3, 7, 14, 30");
        } catch (error) {
            console.error("Failed to add profile", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this profile?")) return;
        try {
            await deleteSRSProfile(id);
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const handleSetDefault = async (id: string) => {
        // Unset current default
        const currentDefault = profiles.find(p => p.isDefault);
        if (currentDefault) {
            await updateSRSProfile(currentDefault.id, { isDefault: false });
        }
        await updateSRSProfile(id, { isDefault: true });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <Repeat className="mr-2 text-purple-500" />
                        SRS Profiles
                    </h2>
                    <button onClick={onClose} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium">
                        Close
                    </button>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-800">
                    <div className="flex items-start space-x-2 text-sm text-purple-700 dark:text-purple-300">
                        <Info size={16} className="mt-0.5 flex-shrink-0" />
                        <p>
                            Define review intervals in days. E.g., "1, 3, 7" means reviews happen 1 day, 3 days, and 7 days after completion.
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* List */}
                    <div className="space-y-2">
                        {profiles.map(profile => (
                            <div key={profile.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-lg">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold text-gray-800 dark:text-gray-200">{profile.name}</span>
                                        {profile.isDefault && (
                                            <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">DEFAULT</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 font-mono">
                                        [{profile.intervals.join(", ")}] days
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {!profile.isDefault && (
                                        <button
                                            onClick={() => handleSetDefault(profile.id)}
                                            className="text-xs text-blue-500 hover:underline px-2"
                                        >
                                            Make Default
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(profile.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Form */}
                    <form onSubmit={handleAdd} className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg space-y-3">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Add New Profile</h3>
                        <div>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Profile Name (e.g., Hard Mode)"
                                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:border-purple-500 outline-none"
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                value={intervals}
                                onChange={e => setIntervals(e.target.value)}
                                placeholder="Intervals (1, 3, 7...)"
                                className="w-full p-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:border-purple-500 outline-none font-mono"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium flex items-center justify-center space-x-1"
                        >
                            <Plus size={16} />
                            <span>Add Profile</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
