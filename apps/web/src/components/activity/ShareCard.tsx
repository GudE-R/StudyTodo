"use client";

import React, { forwardRef } from "react";
import { format, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import { Session, Todo, Category } from "@pomarc/shared";
import { StreakStats } from "@/lib/statistics";
import { Flame, Trophy, Clock, CheckCircle } from "lucide-react";

interface ShareCardProps {
    sessions: Session[];
    todos: Todo[];
    categories: Category[];
    streak: StreakStats;
    targetCategory?: string;
    userName?: string;
    totalDuration: number;
    completedCount: number;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({
    sessions,
    todos,
    categories,
    streak,
    targetCategory = "all",
    userName = "PomArc User",
    totalDuration,
    completedCount
}, ref) => {

    const today = new Date();

    const targetCategoryName = targetCategory === "all"
        ? "All Categories"
        : categories.find(c => c.id === targetCategory)?.name || "Category";

    const totalMinutes = Math.floor(totalDuration / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Growth track - last 7 days for simpler display
    const growthTrackDays = eachDayOfInterval({
        start: subDays(today, 6),
        end: today
    });

    return (
        <div
            ref={ref}
            className="bg-white text-gray-900 p-6 w-[400px] h-[480px] flex flex-col relative overflow-hidden font-sans rounded-2xl shadow-lg border border-gray-200"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">P</span>
                    </div>
                    <span className="font-bold text-xl text-gray-900">PomArc</span>
                </div>
                <div className="text-sm text-gray-500">
                    {format(today, "yyyy.MM.dd")}
                </div>
            </div>

            {/* Streak Badges */}
            <div className="flex space-x-3 mb-6">
                <div className="flex items-center space-x-2 bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
                    <Flame size={18} className="text-orange-500" />
                    <span className="font-bold text-orange-700">{streak.currentStreak}日連続</span>
                </div>
                <div className="flex items-center space-x-2 bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-100">
                    <Trophy size={18} className="text-yellow-600" />
                    <span className="font-bold text-yellow-700">最高{streak.longestStreak}日</span>
                </div>
            </div>

            {/* Main Stats */}
            <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100">
                <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 text-gray-500 text-xs mb-1">
                            <Clock size={12} />
                            <span>総学習時間</span>
                        </div>
                        <div className="flex items-baseline justify-center">
                            {hours > 0 && (
                                <>
                                    <span className="text-4xl font-black text-blue-600">{hours}</span>
                                    <span className="text-lg text-gray-500 ml-1">h</span>
                                </>
                            )}
                            <span className="text-4xl font-black text-blue-600 ml-1">{minutes}</span>
                            <span className="text-lg text-gray-500 ml-1">m</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 text-gray-500 text-xs mb-1">
                            <CheckCircle size={12} />
                            <span>完了タスク</span>
                        </div>
                        <div className="flex items-baseline justify-center">
                            <span className="text-4xl font-black text-green-600">{completedCount}</span>
                            <span className="text-lg text-gray-500 ml-1">件</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Track */}
            <div className="mb-6">
                <div className="text-xs text-gray-500 mb-2">過去7日間の活動</div>
                <div className="flex justify-between gap-1">
                    {growthTrackDays.map((day, i) => {
                        const hasActivity = sessions.some(s => isSameDay(new Date(s.createdAt), day));
                        const isToday = isSameDay(day, today);
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center">
                                <div
                                    className={`w-full h-8 rounded-lg ${hasActivity
                                        ? 'bg-green-500'
                                        : 'bg-gray-100 border border-gray-200'
                                        }`}
                                />
                                <span className={`text-[10px] mt-1 ${isToday ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                                    {format(day, "E").charAt(0)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                        {userName.charAt(0)}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-800">{userName}</div>
                        <div className="text-[10px] text-gray-400">pomarc.app</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-400">成果をカタチに。</div>
                </div>
            </div>
        </div>
    );
});

ShareCard.displayName = "ShareCard";
