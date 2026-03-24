"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, ArrowRight } from "lucide-react";

interface StepWelcomeInputProps {
    onNext: (value: string) => void;
}

export function StepWelcomeInput({ onNext }: StepWelcomeInputProps) {
    const t = useTranslations("interactiveOnboarding");
    const [value, setValue] = useState("");

    const handleSubmit = () => {
        const trimmed = value.trim();
        if (trimmed) onNext(trimmed);
    };

    return (
        <div className="flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-8 shadow-lg">
                <BookOpen className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                {t("step1Title")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
                {t("step1Subtitle")}
            </p>

            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={t("step1Placeholder")}
                autoFocus
                className="w-full max-w-md px-5 py-4 text-lg rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />

            <button
                onClick={handleSubmit}
                disabled={!value.trim()}
                className="mt-6 inline-flex items-center gap-2 px-8 py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 group"
            >
                {t("step1Cta")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}
