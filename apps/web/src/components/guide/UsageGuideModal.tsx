"use client";

import React from "react";
import { X, Play, Calendar, Clock, Repeat, Palette, BookOpen } from "lucide-react";

interface UsageGuideModalProps {
    onClose: () => void;
}

export function UsageGuideModal({ onClose }: UsageGuideModalProps) {
    const features = [
        {
            icon: Play,
            title: "Pomodoro Timer",
            description: "Study efficiently with 25min focus + 5min break cycles."
        },
        {
            icon: Calendar,
            title: "Study Schedule",
            description: "Manage your study plan with Drag & Drop."
        },
        {
            icon: Repeat,
            title: "SRS (Spaced Repetition)",
            description: "Review tasks at optimal intervals based on the Forgetting Curve."
        },
        {
            icon: Clock,
            title: "Session Recording",
            description: "Track your study time for each task."
        },
        {
            icon: Palette,
            title: "Theme Customization",
            description: "Switch between Light, Dark, and System themes."
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                        <BookOpen className="text-blue-500" />
                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Usage Guide</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {features.map((feature, index) => (
                            <div key={index} className="flex space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                                <div className="flex-shrink-0">
                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-blue-500">
                                        <feature.icon size={24} />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-1">{feature.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <h3 className="font-bold text-blue-700 dark:text-blue-300 mb-2">Need Help?</h3>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            This application is designed to help students manage their tasks and study time effectively. Start by adding a Category and a Todo!
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
