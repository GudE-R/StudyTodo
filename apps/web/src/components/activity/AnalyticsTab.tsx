"use client";

import React, { useState } from "react";
import { format, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, eachDayOfInterval, eachMonthOfInterval, getMonth, getYear } from "date-fns";
import { ja } from "date-fns/locale";
import { Filter } from "lucide-react";
import { Session, Todo, Category } from "@studytodo/shared";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useTranslations } from "next-intl";

type Range = "week" | "month" | "year" | "all";

interface AnalyticsTabProps {
    sessions: Session[];
    todos: Todo[];
    flatCategories: Category[];
}

export function AnalyticsTab({ sessions, todos, flatCategories }: AnalyticsTabProps) {
    const [range, setRange] = useState<Range>("week");
    const [analyticsCategory, setAnalyticsCategory] = useState<string>("all");

    const t = useTranslations("activity");

    // --- Analytics Logic ---
    const getFilteredSessions = () => {
        const now = new Date();
        return sessions.filter(session => {
            const date = new Date(session.createdAt);

            // Category Filter
            if (analyticsCategory !== "all") {
                const todo = todos.find(t => t.id === session.todoId);
                if (!todo || todo.categoryId !== analyticsCategory) return false; // Use categoryId
            }

            switch (range) {
                case "week": return isWithinInterval(date, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });
                case "month": return isWithinInterval(date, { start: startOfMonth(now), end: endOfMonth(now) });
                case "year": return isWithinInterval(date, { start: startOfYear(now), end: endOfYear(now) });
                case "all": return true;
                default: return true;
            }
        });
    };

    const filteredSessions = getFilteredSessions();
    const totalDuration = filteredSessions.reduce((acc, s) => acc + s.duration, 0);
    const totalDurationHours = Math.floor(totalDuration / 3600);
    const totalDurationMinutes = Math.floor((totalDuration % 3600) / 60);

    // Chart Data Aggregation
    const getChartData = () => {
        const now = new Date();
        let data: { name: string; time: number; count: number; date?: Date; month?: number; year?: number }[] = [];

        if (range === "week") {
            // Daily (Mon-Sun)
            const start = startOfWeek(now, { weekStartsOn: 1 });
            const end = endOfWeek(now, { weekStartsOn: 1 });
            const days = eachDayOfInterval({ start, end });

            data = days.map(day => ({
                name: format(day, "EEE", { locale: ja }),
                time: 0,
                count: 0,
                date: day // Keep date for matching
            }));

            filteredSessions.forEach(session => {
                const date = new Date(session.createdAt);
                const index = data.findIndex(d => d.date && isSameDay(d.date, date));
                if (index !== -1) data[index].time += Math.round(session.duration / 60);
            });
            // Count completed todos
            todos.filter(t => {
                if (!t.completed) return false;
                if (analyticsCategory !== "all" && t.categoryId !== analyticsCategory) return false; // Use categoryId
                return true;
            }).forEach(t => {
                const date = new Date(t.createdAt);
                const index = data.findIndex(d => d.date && isSameDay(d.date, date));
                if (index !== -1) data[index].count += 1;
            });

        } else if (range === "month") {
            // Daily (1-31)
            const start = startOfMonth(now);
            const end = endOfMonth(now);
            const days = eachDayOfInterval({ start, end });

            data = days.map(day => ({
                name: format(day, "d"),
                time: 0,
                count: 0,
                date: day
            }));

            filteredSessions.forEach(session => {
                const date = new Date(session.createdAt);
                const index = data.findIndex(d => d.date && isSameDay(d.date, date));
                if (index !== -1) data[index].time += Math.round(session.duration / 60);
            });
            todos.filter(t => {
                if (!t.completed) return false;
                if (analyticsCategory !== "all" && t.categoryId !== analyticsCategory) return false; // Use categoryId
                return true;
            }).forEach(t => {
                const date = new Date(t.createdAt);
                const index = data.findIndex(d => d.date && isSameDay(d.date, date));
                if (index !== -1) data[index].count += 1;
            });

        } else if (range === "year") {
            // Monthly (1-12)
            const start = startOfYear(now);
            const end = endOfYear(now);
            const months = eachMonthOfInterval({ start, end });

            data = months.map(month => ({
                name: format(month, "M月"),
                time: 0,
                count: 0,
                month: getMonth(month)
            }));

            filteredSessions.forEach(session => {
                const date = new Date(session.createdAt);
                const month = getMonth(date);
                const index = data.findIndex(d => d.month === month);
                if (index !== -1) data[index].time += Math.round(session.duration / 60);
            });
            todos.filter(t => {
                if (!t.completed) return false;
                if (analyticsCategory !== "all" && t.categoryId !== analyticsCategory) return false; // Use categoryId
                return true;
            }).forEach(t => {
                const date = new Date(t.createdAt);
                const month = getMonth(date);
                const index = data.findIndex(d => d.month === month);
                if (index !== -1) data[index].count += 1;
            });
        } else {
            // All: By Year
            const currentYear = getYear(now);
            for (let i = currentYear - 4; i <= currentYear; i++) {
                data.push({ name: `${i}`, time: 0, count: 0, year: i });
            }

            filteredSessions.forEach(session => {
                const year = getYear(new Date(session.createdAt));
                const index = data.findIndex(d => d.year === year);
                if (index !== -1) data[index].time += Math.round(session.duration / 60);
            });
            todos.filter(t => {
                if (!t.completed) return false;
                if (analyticsCategory !== "all" && t.categoryId !== analyticsCategory) return false; // Use categoryId
                return true;
            }).forEach(t => {
                const year = getYear(new Date(t.createdAt));
                const index = data.findIndex(d => d.year === year);
                if (index !== -1) data[index].count += 1;
            });
        }

        return data;
    };

    const chartData = getChartData();

    // Pie Chart Data Aggregation
    const getPieData = () => {
        const distribution: { [key: string]: { name: string, value: number, color: string } } = {};

        filteredSessions.forEach(session => {
            const todo = todos.find(t => t.id === session.todoId);
            const catId = todo?.categoryId || "none";
            const category = flatCategories.find(c => c.id === catId);
            const name = category?.name || (catId === "none" ? "No Category" : "Unknown");
            const color = category?.color || "#9ca3af"; // gray-400

            if (!distribution[catId]) {
                distribution[catId] = { name, value: 0, color };
            }
            distribution[catId].value += Math.round(session.duration / 60);
        });

        // Filter out zero values and sort
        return Object.values(distribution)
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value);
    };
    const pieData = getPieData();

    return (
        <div className="space-y-6">
            {/* Controls: Range Picker & Category Filter */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex bg-white dark:bg-gray-700 rounded-full shadow-sm border border-gray-200 dark:border-gray-600 p-1">
                    {(["week", "month", "year", "all"] as Range[]).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${range === r ? "bg-blue-600 text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600"}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>

                <div className="flex items-center space-x-2">
                    <Filter size={16} className="text-gray-400" />
                    <select
                        value={analyticsCategory}
                        onChange={(e) => setAnalyticsCategory(e.target.value)}
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                    >
                        <option value="all">All Categories</option>
                        {flatCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option> // Use cat.id
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{t("totalFocusTime")}</div>
                    <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                        {totalDurationHours}<span className="text-lg font-normal text-gray-500 ml-1">h</span>
                        {totalDurationMinutes}<span className="text-lg font-normal text-gray-500 ml-1">m</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{t("completedTasks")}</div>
                    <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                        {/* Count completed todos matching filter */}
                        {todos.filter(t => t.completed && (analyticsCategory === "all" || t.categoryId === analyticsCategory) && // Use categoryId
                            (range === "all" ? true :
                                range === "week" ? isWithinInterval(new Date(t.createdAt), { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) }) :
                                    range === "month" ? isWithinInterval(new Date(t.createdAt), { start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) :
                                        range === "year" ? isWithinInterval(new Date(t.createdAt), { start: startOfYear(new Date()), end: endOfYear(new Date()) }) : true
                            )
                        ).length}
                        <span className="text-lg font-normal text-gray-500 ml-1">{t("tasksUnit")}</span>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart: Trend */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 h-80 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{t("focusTrend")}</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="time" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t("timeMin")} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart: Distribution */}
                <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 h-80 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{t("categoryDistribution")}</h3>
                    <div className="flex-1 min-h-0 relative">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => [`${Math.round(Number(value))} min`, t("timeMin")]}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                {t("noData")}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
