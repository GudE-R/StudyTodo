"use client";

import React from "react";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface IconPickerProps {
    value: string; // Icon name
    onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    // Only showing a subset of icons for performance and simplicity
    const iconList = [
        "LayoutTemplate", "Zap", "Activity", "BookOpen", "Briefcase", "Coffee", "Code", "Database", "Flag", "MapPin", "Music", "Settings", "Star", "User", "Heart", "Home", "Image", "Smile", "Sun", "Moon"
    ];

    const CurrentIcon = (Icons as any)[value] as LucideIcon | undefined;

    return (
        <div className="flex flex-wrap gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto">
            {iconList.map(name => {
                const Icon = (Icons as any)[name];
                if (!Icon) return null;
                const isSelected = value === name;
                return (
                    <button
                        key={name}
                        type="button"
                        onClick={() => onChange(name)}
                        className={`p-2 rounded-lg transition-colors ${isSelected ? "bg-blue-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"}`}
                        title={name}
                    >
                        <Icon size={20} />
                    </button>
                );
            })}
        </div>
    );
}
