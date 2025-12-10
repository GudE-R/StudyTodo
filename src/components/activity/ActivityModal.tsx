"use client";

import React, { useState } from "react";
import { format, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, eachDayOfInterval, eachMonthOfInterval, getHours, getDate, getMonth, getYear, subDays } from "date-fns";
import { ja } from "date-fns/locale";
import { X, BarChart2, History, Trash2, Filter, Calendar } from "lucide-react";
import { Session, Todo, Category } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessions: Session[];
    todos: Todo[];
    onDeleteTodo: (todoId: string) => void;
    categories: Category[];
}

type Tab = "analytics" | "history";
type Range = "week" | "month" | "year" | "all";

export function ActivityModal({ isOpen, onClose, sessions, todos, onDeleteTodo, categories }: ActivityModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>("analytics");
    const [range, setRange] = useState<Range>("week");
    const [analyticsCategory, setAnalyticsCategory] = useState<string>("all");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "incomplete">("all");
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    if (!isOpen) return null;

    // Flatten categories for dropdown
    const flattenCategories = (cats: Category[]): Category[] => {
        let flat: Category[] = [];
        cats.forEach(c => {
            flat.push(c);
            if (c.children) {
                flat = [...flat, ...flattenCategories(c.children)];
            }
        });
        return flat;
    };
    const flatCategories = flattenCategories(categories);

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
                if (index !== -1) data[index].time += session.duration / 60;
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
                if (index !== -1) data[index].time += session.duration / 60;
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
                if (index !== -1) data[index].time += session.duration / 60;
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
            // All: Yearly (Last 5 years?) - For simplicity, let's just show by Year
            // Or maybe just show last 12 months if "All" is too broad.
            // Let's implement "All" as "By Year" for now.
            // Mocking years for simplicity as we likely don't have much data
            const currentYear = getYear(now);
            for (let i = currentYear - 4; i <= currentYear; i++) {
                data.push({ name: `${i}`, time: 0, count: 0, year: i });
            }

            filteredSessions.forEach(session => {
                const year = getYear(new Date(session.createdAt));
                const index = data.findIndex(d => d.year === year);
                if (index !== -1) data[index].time += session.duration / 60;
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

    // --- History Logic ---
    const getFilteredTodos = () => {
        return todos.filter(todo => {
            const matchesCategory = filterCategory === "all" || todo.categoryId === filterCategory; // Use categoryId
            const matchesStatus = filterStatus === "all"
                ? true
                : filterStatus === "completed" ? todo.completed : !todo.completed;
            return matchesCategory && matchesStatus;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    const filteredTodos = getFilteredTodos();

    const handleDeleteClick = (id: string) => {
        if (deleteConfirmId === id) {
            onDeleteTodo(id);
            setDeleteConfirmId(null);
        } else {
            setDeleteConfirmId(id);
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity p-4">
            <div className="w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-bold text-gray-800">Activity</h2>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab("analytics")}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "analytics" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                <div className="flex items-center space-x-2">
                                    <BarChart2 size={16} />
                                    <span>Analytics</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("history")}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "history" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                <div className="flex items-center space-x-2">
                                    <History size={16} />
                                    <span>History</span>
                                </div>
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
                    {activeTab === "analytics" ? (
                        <div className="space-y-6">
                            {/* Controls: Range Picker & Category Filter */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex bg-white rounded-full shadow-sm border border-gray-200 p-1">
                                    {(["week", "month", "year", "all"] as Range[]).map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setRange(r)}
                                            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${range === r ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
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
                                        className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
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
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="text-sm text-gray-500 font-medium mb-1">Total Focus Time</div>
                                    <div className="text-3xl font-bold text-gray-800">
                                        {totalDurationHours}<span className="text-lg font-normal text-gray-500 ml-1">h</span>
                                        {totalDurationMinutes}<span className="text-lg font-normal text-gray-500 ml-1">m</span>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="text-sm text-gray-500 font-medium mb-1">Completed Todos</div>
                                    <div className="text-3xl font-bold text-gray-800">
                                        {/* Count completed todos matching filter */}
                                        {todos.filter(t => t.completed && (analyticsCategory === "all" || t.categoryId === analyticsCategory) && // Use categoryId
                                            (range === "all" ? true :
                                                range === "week" ? isWithinInterval(new Date(t.createdAt), { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) }) :
                                                    range === "month" ? isWithinInterval(new Date(t.createdAt), { start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) :
                                                        range === "year" ? isWithinInterval(new Date(t.createdAt), { start: startOfYear(new Date()), end: endOfYear(new Date()) }) : true
                                            )
                                        ).length}
                                        <span className="text-lg font-normal text-gray-500 ml-1">tasks</span>
                                    </div>
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Focus Time Trend (min)</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                        <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                        <Tooltip
                                            cursor={{ fill: '#f3f4f6' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="time" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Time (min)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Filters */}
                            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center space-x-2 text-gray-500">
                                    <Filter size={18} />
                                    <span className="text-sm font-medium">Filters:</span>
                                </div>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as any)}
                                    className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                                >
                                    <option value="all">All Status</option>
                                    <option value="completed">Completed</option>
                                    <option value="incomplete">Incomplete</option>
                                </select>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                                >
                                    <option value="all">All Categories</option>
                                    {flatCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option> // Use cat.id
                                    ))}
                                </select>
                            </div>

                            {/* Todo List */}
                            <div className="space-y-2">
                                {filteredTodos.map(todo => (
                                    <div key={todo.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-blue-200 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-2 h-12 rounded-full ${todo.completed ? "bg-green-500" : "bg-gray-300"}`} />
                                            <div>
                                                <div className="font-bold text-gray-800">{todo.title}</div>
                                                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                                                        {todo.categoryId ? (flatCategories.find(c => c.id === todo.categoryId)?.name || "Unknown") : "No Category"}
                                                    </span>
                                                    <span>{format(new Date(todo.createdAt), "yyyy/MM/dd HH:mm")}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteClick(todo.id)}
                                            className={`p-2 rounded-full transition-colors ${deleteConfirmId === todo.id ? "bg-red-50 text-red-600" : "text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100"}`}
                                        >
                                            {deleteConfirmId === todo.id ? <Trash2 size={18} fill="currentColor" /> : <Trash2 size={18} />}
                                        </button>
                                    </div>
                                ))}
                                {filteredTodos.length === 0 && (
                                    <div className="text-center py-12 text-gray-400">
                                        No tasks found matching your filters.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
