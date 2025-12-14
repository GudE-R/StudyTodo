"use client";

import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeEditor() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="p-4 space-y-4">
            <h3 className="font-bold text-gray-700 dark:text-gray-200">Appearance</h3>
            <div className="grid grid-cols-3 gap-4">
                <button
                    onClick={() => setTheme("light")}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === "light" ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                >
                    <Sun size={24} className="mb-2" />
                    <span className="font-medium text-sm">Light</span>
                </button>
                <button
                    onClick={() => setTheme("dark")}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === "dark" ? "border-blue-500 bg-blue-900/20 text-blue-400" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                >
                    <Moon size={24} className="mb-2" />
                    <span className="font-medium text-sm">Dark</span>
                </button>
                <button
                    onClick={() => setTheme("system")}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === "system" ? "border-blue-500 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                >
                    <Monitor size={24} className="mb-2" />
                    <span className="font-medium text-sm">System</span>
                </button>
            </div>
        </div>
    );
}
