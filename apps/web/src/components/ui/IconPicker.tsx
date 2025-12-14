"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import * as LucideIcons from "lucide-react";

// よく使われるアイコンのリスチE
const POPULAR_ICONS = [
    "Book", "Code", "Music", "Palette", "Calculator", "Globe",
    "Briefcase", "GraduationCap", "Lightbulb", "Target", "Trophy",
    "Heart", "Star", "Zap", "Flame", "Rocket", "Brain", "Atom",
    "Languages", "PenTool", "Camera", "Video", "Headphones",
    "Gamepad2", "Dumbbell", "Utensils", "Coffee", "Home"
];

interface IconPickerProps {
    value?: string;
    onChange: (iconName: string | undefined) => void;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * アイコン選択コンポ�EネンチE
 * 
 * Lucide Reactのアイコンから選択できるモーダルUIです、E
 */
export function IconPicker({ value, onChange, isOpen, onClose }: IconPickerProps) {
    const [searchTerm, setSearchTerm] = useState("");

    if (!isOpen) return null;

    // フィルタリングされたアイコンリスチE
    const filteredIcons = searchTerm
        ? POPULAR_ICONS.filter(name =>
            name.toLowerCase().includes(searchTerm.toLowerCase()))
        : POPULAR_ICONS;

    // アイコンコンポ�Eネントを動的に取征E
    const getIconComponent = (name: string) => {
        const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name];
        return IconComponent || null;
    };

    const handleSelect = (iconName: string) => {
        onChange(iconName);
        onClose();
    };

    const handleClear = () => {
        onChange(undefined);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-sm mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">アイコンを選抁E/h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="アイコンを検索..."
                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Icon Grid */}
                <div className="p-3 max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-6 gap-2">
                        {filteredIcons.map((iconName) => {
                            const IconComponent = getIconComponent(iconName);
                            if (!IconComponent) return null;

                            const isSelected = value === iconName;
                            return (
                                <button
                                    key={iconName}
                                    onClick={() => handleSelect(iconName)}
                                    className={`p-3 rounded-xl transition-colors flex items-center justify-center
                                        ${isSelected
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        }`}
                                    title={iconName}
                                >
                                    <IconComponent size={20} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-3 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={handleClear}
                        className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        アイコンを削除
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * アイコン表示用のヘルパ�Eコンポ�EネンチE
 */
export function CategoryIcon({ iconName, size = 16, className = "" }: { iconName?: string; size?: number; className?: string }) {
    if (!iconName) return null;

    const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[iconName];
    if (!IconComponent) return null;

    return <IconComponent size={size} className={className} />;
}
