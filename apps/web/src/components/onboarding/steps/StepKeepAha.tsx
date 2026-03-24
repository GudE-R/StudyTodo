"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Clock, Check } from "lucide-react";
import { format } from "date-fns";

interface StepKeepAhaProps {
    onNext: () => void;
}

export function StepKeepAha({ onNext }: StepKeepAhaProps) {
    const t = useTranslations("interactiveOnboarding");
    const [keptSlot, setKeptSlot] = useState<number | null>(null);

    // 現在時刻の前後3時間分のスロット（30分刻み）
    const slots = useMemo(() => {
        const now = new Date();
        const currentHour = now.getHours();
        const startHour = Math.max(0, currentHour - 1);
        const result: { hour: number; minute: number; label: string }[] = [];
        for (let h = startHour; h < Math.min(24, startHour + 6); h++) {
            result.push({ hour: h, minute: 0, label: `${String(h).padStart(2, "0")}:00` });
            result.push({ hour: h, minute: 30, label: `${String(h).padStart(2, "0")}:30` });
        }
        return result;
    }, []);

    // パルスアニメーションを出すガイドスロット（現在時刻の次のスロット）
    const guideSlotIndex = useMemo(() => {
        const now = new Date();
        const currentMinute = now.getHours() * 60 + now.getMinutes();
        const idx = slots.findIndex(s => s.hour * 60 + s.minute > currentMinute);
        return idx >= 0 ? idx : 2;
    }, [slots]);

    const handleLongPress = (index: number) => {
        setKeptSlot(prev => prev === index ? null : index);
    };

    return (
        <div className="flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-8 shadow-lg">
                <Clock className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                {t("step3Title")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                {t("step3Desc")}
            </p>

            {/* Mini schedule */}
            <div className="w-full max-w-sm mb-6">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {format(new Date(), "M/d (EEE)")}
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    {slots.map((slot, i) => {
                        const isKept = keptSlot === i;
                        const isGuide = i === guideSlotIndex && keptSlot === null;
                        return (
                            <TimeSlot
                                key={i}
                                label={slot.label}
                                isKept={isKept}
                                isGuide={isGuide}
                                hintText={t("step3Hint")}
                                onLongPress={() => handleLongPress(i)}
                            />
                        );
                    })}
                </div>
            </div>

            {keptSlot !== null && (
                <p className="text-sm text-green-600 dark:text-green-400 mb-4 animate-in fade-in duration-300">
                    {t("step3Kept")}
                </p>
            )}

            <button
                onClick={onNext}
                disabled={keptSlot === null}
                className="inline-flex items-center gap-2 px-8 py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200"
            >
                {t("step3Cta")}
                <Check className="w-5 h-5" />
            </button>
        </div>
    );
}

function TimeSlot({
    label,
    isKept,
    isGuide,
    hintText,
    onLongPress,
}: {
    label: string;
    isKept: boolean;
    isGuide: boolean;
    hintText: string;
    onLongPress: () => void;
}) {
    const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
    const [pressing, setPressing] = useState(false);

    const handlePointerDown = () => {
        setPressing(true);
        const timer = setTimeout(() => {
            onLongPress();
            setPressing(false);
        }, 500);
        setPressTimer(timer);
    };

    const handlePointerUp = () => {
        setPressing(false);
        if (pressTimer) {
            clearTimeout(pressTimer);
            setPressTimer(null);
        }
    };

    return (
        <div
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={`relative flex items-center px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer select-none transition-all duration-200 ${
                isKept
                    ? "bg-orange-50 dark:bg-orange-900/20"
                    : pressing
                    ? "bg-gray-100 dark:bg-gray-700"
                    : "hover:bg-gray-50 dark:hover:bg-gray-750"
            }`}
        >
            <span className={`text-sm font-mono ${
                isKept ? "text-orange-600 dark:text-orange-400 font-bold" : "text-gray-500 dark:text-gray-400"
            }`}>
                {label}
            </span>

            {isKept && (
                <span className="ml-auto text-xs font-medium text-orange-500 dark:text-orange-400 animate-in fade-in duration-200">
                    KEEP
                </span>
            )}

            {isGuide && (
                <span className="ml-auto text-xs font-medium text-blue-500 animate-pulse">
                    {hintText}
                </span>
            )}
        </div>
    );
}
