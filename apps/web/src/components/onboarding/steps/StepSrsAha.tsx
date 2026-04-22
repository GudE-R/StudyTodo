"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Brain, Sparkles, Check } from "lucide-react";
import { addDays, format } from "date-fns";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { dataService } from "@/services/dataService";
import { generateId } from "@/lib/utils";
import { Todo } from "@studytodo/shared";

interface StepSrsAhaProps {
    studyTopic: string;
    onNext: () => void;
}

export function StepSrsAha({ studyTopic, onNext }: StepSrsAhaProps) {
    const t = useTranslations("interactiveOnboarding");
    const [saved, setSaved] = useState(false);

    const srsProfiles = useLiveQuery(() => db.srsProfiles.toArray()) || [];
    const defaultProfile = srsProfiles.find(p => p.isDefault) || srsProfiles[0];

    const timeline = useMemo(() => {
        const intervals = defaultProfile?.intervals || [1, 3, 7, 14, 30];
        const today = new Date();
        const items = [
            { label: t("step2Today"), date: today, title: studyTopic, isOriginal: true },
            ...intervals.map((days, i) => ({
                label: t("step2Day", { n: days }),
                date: addDays(today, days),
                title: `${studyTopic} (${i + 1}回目)`,
                isOriginal: false,
            })),
        ];
        return items;
    }, [defaultProfile, studyTopic, t]);

    const handleStart = async () => {
        if (!defaultProfile || saved) return;

        const baseTodo: Todo = {
            id: generateId(),
            title: studyTopic,
            completed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            dueDate: new Date(),
            srsInterval: defaultProfile.name,
            srsProfileId: defaultProfile.id,
        };

        await dataService.addSRSTodos(baseTodo, defaultProfile.intervals);
        setSaved(true);
        setTimeout(onNext, 800);
    };

    return (
        <div className="flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-8 shadow-lg">
                <Brain className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                {t("step2Title")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                {t("step2Desc")}
            </p>

            {/* Timeline */}
            <div className="w-full max-w-lg mb-8">
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-gradient-to-b from-blue-500 to-green-500" />

                    <div className="space-y-3">
                        {timeline.map((item, i) => (
                            <div
                                key={i}
                                className="relative flex items-center gap-4 animate-in slide-in-from-left duration-300"
                                style={{ animationDelay: `${i * 100}ms`, animationFillMode: "backwards" }}
                            >
                                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                                    item.isOriginal
                                        ? "bg-blue-500 text-white"
                                        : "bg-white dark:bg-gray-800 border-2 border-green-500 text-green-600"
                                }`}>
                                    {item.isOriginal ? (
                                        <Sparkles className="w-5 h-5" />
                                    ) : (
                                        <span className="text-sm font-bold">{i}</span>
                                    )}
                                </div>
                                <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700 text-left shadow-sm">
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {item.label} — {format(item.date, "M/d")}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={handleStart}
                disabled={saved}
                className={`inline-flex items-center gap-2 px-8 py-3 text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 ${
                    saved
                        ? "bg-green-500 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25"
                }`}
            >
                {saved ? (
                    <>
                        <Check className="w-5 h-5" />
                    </>
                ) : (
                    t("step2Cta")
                )}
            </button>
        </div>
    );
}
