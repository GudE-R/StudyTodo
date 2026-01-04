"use client";

import React, { forwardRef } from "react";
import { format, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Session, Todo, Category } from "@pomarc/shared";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { StreakStats } from "@/lib/statistics";
import { Flame, Trophy, Zap, Download, Tag, Hash } from "lucide-react";

interface ShareCardProps {
    sessions: Session[];
    todos: Todo[];
    categories: Category[];
    streak: StreakStats;
    targetCategory?: string; // "all" or categoryId
    userName?: string;
    totalDuration: number;
    completedCount: number;
}

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

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

    // --- Data Processing for Pie Chart ---
    const getPieData = () => {
        const data: { name: string; value: number }[] = [];
        const categoryMap = new Map<string, number>();

        const relevantSessions = targetCategory === "all"
            ? sessions
            : sessions.filter(s => {
                const todo = todos.find(t => t.id === s.todoId);
                return todo?.categoryId === targetCategory;
            });

        if (targetCategory === "all") {
            relevantSessions.forEach(s => {
                const todo = todos.find(t => t.id === s.todoId);
                const catId = todo?.categoryId || "uncategorized";
                categoryMap.set(catId, (categoryMap.get(catId) || 0) + s.duration);
            });
        } else {
            relevantSessions.forEach(s => {
                const todo = todos.find(t => t.id === s.todoId);
                const catId = todo?.categoryId || "uncategorized";
                categoryMap.set(catId, (categoryMap.get(catId) || 0) + s.duration);
            });
        }

        Array.from(categoryMap.entries()).forEach(([catId, duration]) => {
            const catName = categories.find(c => c.id === catId)?.name || (catId === "uncategorized" ? "No Category" : "Unknown");
            data.push({ name: catName, value: duration });
        });

        data.sort((a, b) => b.value - a.value);
        if (data.length > 4) {
            const top4 = data.slice(0, 4);
            // const others = data.slice(4).reduce((acc, curr) => acc + curr.value, 0);
            // top4.push({ name: "Others", value: others });
            return top4; // Image shows 4 items
        }
        return data.filter(d => d.value > 0);
    };

    const pieData = getPieData();
    // Default data if empty to show something nice
    const displayPieData = pieData.length > 0 ? pieData : [{ name: "Focus", value: 1 }];
    const isPlaceholderData = pieData.length === 0;

    const targetCategoryName = targetCategory === "all"
        ? "All Categories"
        : categories.find(c => c.id === targetCategory)?.name || "Category";

    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    const totalMinutes = Math.floor(totalDuration / 60);

    // --- Data Processing for Growth Track (Last 12 days) ---
    const growthTrackDays = eachDayOfInterval({
        start: subDays(today, 11),
        end: today
    });

    return (
        <div ref={ref} className="bg-[#0f172a] text-white p-8 w-[600px] h-[600px] flex flex-col relative overflow-hidden font-sans rounded-[40px] shadow-2xl border border-gray-800">

            {/* Header */}
            <div className="flex items-center justify-between mb-8 z-10">
                <div className="flex items-center space-x-2">
                    <span className="font-bold text-3xl tracking-tight">PomArc</span>
                </div>
                <div className="flex space-x-3">
                    <div className="flex items-center space-x-2 bg-[#1e293b] px-4 py-2 rounded-full border border-gray-700">
                        <Flame size={18} className="text-orange-500 fill-orange-500" />
                        <span className="font-bold">{streak.currentStreak}日</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-[#1e293b] px-4 py-2 rounded-full border border-gray-700">
                        <Trophy size={18} className="text-yellow-500" />
                        <span className="font-bold">{streak.longestStreak}日</span>
                    </div>
                </div>
            </div>

            {/* Growth Track */}
            <div className="bg-[#1e293b] rounded-2xl p-4 mb-6 z-10 border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">GROWTH TRACK</span>
                    <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    </div>
                </div>
                <div className="flex justify-between">
                    {growthTrackDays.map((day, i) => {
                        const hasActivity = sessions.some(s => isSameDay(new Date(s.createdAt), day));
                        return (
                            <div
                                key={i}
                                className={`w-9 h-9 rounded-lg border border-gray-700/50 ${hasActivity ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-gray-600/30'}`}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Info Badges */}
            <div className="flex items-center space-x-3 mb-6 z-10">
                <div className="bg-[#334155] px-4 py-1.5 rounded-full text-sm text-gray-200 font-medium">
                    {format(today, "yyyy.MM.dd EEE")}
                </div>
                <div className="bg-white text-gray-900 px-4 py-1.5 rounded-full text-sm font-bold flex items-center">
                    {targetCategoryName}
                </div>
            </div>

            {/* Tags (Decorational or recent todo tags) */}
            <div className="flex items-center space-x-2 mb-8 z-10 opacity-70">
                <Tag size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-md border border-gray-700">Focus Session</span>
                <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-md border border-gray-700">Study</span>
                <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-md border border-gray-700">Productivity</span>
            </div>

            {/* Main Stats Area */}
            <div className="flex items-stretch justify-between mb-8 z-10">
                {/* Left Stats */}
                <div className="flex flex-col justify-center space-y-6">
                    <div>
                        <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">TOTAL TIME</div>
                        <div className="flex items-baseline">
                            <span className="text-6xl font-black text-white tracking-tighter">{totalMinutes}</span>
                            <span className="text-xl text-gray-400 ml-1 font-medium">min</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">TASKS</div>
                        <div className="flex items-baseline">
                            <span className="text-5xl font-black text-white tracking-tighter">{completedCount}</span>
                            <span className="text-xl text-gray-400 ml-1 font-medium">pts</span>
                        </div>
                    </div>
                </div>

                {/* Right Chart */}
                <div className="bg-[#1e293b] rounded-3xl p-4 w-[320px] flex items-center border border-gray-700 relative">
                    {/* Chart */}
                    <div className="w-40 h-40 relative flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={displayPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={5}
                                    cornerRadius={6}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {displayPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={isPlaceholderData ? '#334155' : COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <Zap className="text-gray-500 w-6 h-6" />
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-col space-y-2 ml-4 flex-1">
                        {!isPlaceholderData && displayPieData.map((entry, index) => (
                            <div key={index} className="flex items-center text-xs text-gray-300">
                                <div className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="truncate">{entry.name}</span>
                            </div>
                        ))}
                        {isPlaceholderData && <span className="text-xs text-gray-500">No category data</span>}
                    </div>
                </div>
            </div>

            {/* Footer / Message */}
            <div className="mt-auto bg-[#1e293b] rounded-2xl p-4 flex items-center justify-between border border-gray-700 z-10">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                        {/* Avatar Placeholder */}
                        <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-gray-800 font-bold text-sm">
                            {userName.charAt(0)}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{userName}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">POMARC MEMBER</span>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="text-right">
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">DOWNLOAD POMARC</div>
                        <div className="text-xs font-bold text-white">成果をカタチに。</div>
                    </div>
                    <div className="bg-white p-1 rounded-lg">
                        {/* URL to QR Code-ish pattern */}
                        <div className="w-10 h-10 border-2 border-dashed border-gray-800 flex items-center justify-center rounded">
                            <span className="text-[8px] font-bold text-black leading-none text-center">SCAN<br />ME</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Gradients */}
            <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-blue-600/20 rounded-full blur-3xl z-0 pointer-events-none" />
            <div className="absolute bottom-[-20px] left-[-20px] w-64 h-64 bg-purple-600/20 rounded-full blur-3xl z-0 pointer-events-none" />

        </div>
    );
});

ShareCard.displayName = "ShareCard";
