"use client";

import React from "react";
import { Sun, Moon, BookOpen, Leaf, Briefcase } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme, Theme } from "@/contexts/ThemeContext";

export function ThemeEditor() {
    const { theme, setTheme } = useTheme();
    const t = useTranslations("theme");

    const themes: { id: Theme; label: string; icon: React.ElementType; description: string }[] = [
        { id: "light", label: t("light"), icon: Sun, description: t("lightDesc") },
        { id: "dark", label: t("dark"), icon: Moon, description: t("darkDesc") },
        { id: "paper-classic", label: t("paperClassic"), icon: BookOpen, description: t("paperClassicDesc") },
        { id: "paper-washi", label: t("paperWashi"), icon: Leaf, description: t("paperWashiDesc") },
        { id: "paper-planner", label: t("paperPlanner"), icon: Briefcase, description: t("paperPlannerDesc") },
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t("title")}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("description")}
                </p>
            </div>

            <div className="space-y-2">
                {themes.map((item) => {
                    const Icon = item.icon;
                    const isSelected = theme === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setTheme(item.id)}
                            className={`
                                w-full flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-200
                                ${isSelected
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                                }
                            `}
                        >
                            <div className={`
                                p-2 rounded-lg
                                ${isSelected
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                }
                            `}>
                                <Icon size={20} />
                            </div>
                            <div className="flex-1 text-left">
                                <div className={`text-sm font-bold ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"}`}>
                                    {item.label}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.description}
                                </div>
                            </div>
                            {isSelected && (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
