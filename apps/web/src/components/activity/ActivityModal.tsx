"use client";

import React, { useState } from "react";
import { format, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, eachDayOfInterval, eachMonthOfInterval, getMonth, getYear } from "date-fns";
import { ja } from "date-fns/locale";
import { X, BarChart2, History, Trash2, Filter, Share2, Download, Copy, Twitter, Facebook, Instagram, Hash, ChevronDown, ChevronRight, Layers } from "lucide-react";
import { Session, Todo, Category } from "@pomarc/shared";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TodoTitle } from "@/components/ui/TodoTitle";
import { ShareCard } from "./ShareCard";
import { generateAndCopyImage, downloadImage } from "@/lib/share-image";
import { calculateStreak } from "@/lib/statistics";
import { useTranslations } from "next-intl";

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessions: Session[];
    todos: Todo[];
    onDeleteTodo: (todoId: string) => void;
    onBulkDelete: (ids: string[]) => Promise<void>;
    categories: Category[];
    onOpenTodoDetail: (todo: Todo) => void;
}

type Tab = "analytics" | "history" | "share";
type Range = "week" | "month" | "year" | "all";

export function ActivityModal({ isOpen, onClose, sessions, todos, onDeleteTodo, onBulkDelete, categories, onOpenTodoDetail }: ActivityModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>("analytics");
    const [range, setRange] = useState<Range>("week");
    const [analyticsCategory, setAnalyticsCategory] = useState<string>("all");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "incomplete">("all");
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    // Share Tab State
    const [targetShareCategory, setTargetShareCategory] = useState<string>("all");
    const [isSharing, setIsSharing] = useState(false);
    const shareCardRef = React.useRef<HTMLDivElement>(null);

    const tc = useTranslations("common");
    const t = useTranslations("activity");



    // Toggle Selection
    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleGroup = (groupId: string) => {
        const next = new Set(expandedGroups);
        if (next.has(groupId)) next.delete(groupId);
        else next.add(groupId);
        setExpandedGroups(next);
    };

    const handleBulkDeleteClick = async () => {
        if (selectedIds.size === 0) return;
        if (confirm(t("deleteTodoConfirm", { count: selectedIds.size }))) {
            try {
                await onBulkDelete(Array.from(selectedIds));
                setSelectedIds(new Set());
            } catch (e) {
                console.error("Bulk delete failed", e);
                alert(tc("errorOccurred"));
            }
        }
    };

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
            // All: By Year
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
            distribution[catId].value += session.duration / 60;
        });

        // Filter out zero values and sort
        return Object.values(distribution)
            .filter(d => d.value > 0)
            .sort((a, b) => b.value - a.value);
    };
    const pieData = getPieData();

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

    const timelineItems = React.useMemo(() => {
        const items: (Todo | { type: 'group', id: string, todos: Todo[], title: string, createdAt: Date, completedCount: number })[] = [];
        const seenGroups = new Set<string>();

        filteredTodos.forEach(todo => {
            if (todo.srsGroupId) {
                if (!seenGroups.has(todo.srsGroupId)) {
                    seenGroups.add(todo.srsGroupId);
                    const groupTodos = filteredTodos.filter(t => t.srsGroupId === todo.srsGroupId)
                        .sort((a, b) => {
                            if (!a.dueDate) return 1;
                            if (!b.dueDate) return -1;
                            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                        });
                    items.push({
                        type: 'group',
                        id: todo.srsGroupId,
                        todos: groupTodos,
                        title: groupTodos[0].title, // Use first todo's title as group title
                        createdAt: new Date(groupTodos[0].createdAt),
                        completedCount: groupTodos.filter(t => t.completed).length
                    });
                }
            } else {
                items.push(todo);
            }
        });
        return items;
    }, [filteredTodos]);

    const handleDeleteClick = (id: string) => {
        if (deleteConfirmId === id) {
            onDeleteTodo(id);
            setDeleteConfirmId(null);
        } else {
            setDeleteConfirmId(id);
            setTimeout(() => setDeleteConfirmId(null), 3000);
        }
    };

    // --- Share Logic ---
    const streak = calculateStreak(sessions);

    // Filter sessions/todos for Share Card based on targetShareCategory
    const getShareStats = () => {
        let cardSessions = sessions;
        let cardTodos = todos;

        if (targetShareCategory !== "all") {
            // Filter sessions that belong to todos in this category
            cardSessions = sessions.filter(s => {
                const t = todos.find(todo => todo.id === s.todoId);
                return t && t.categoryId === targetShareCategory;
            });
            // Filter todos
            cardTodos = todos.filter(t => t.categoryId === targetShareCategory);
        }

        const cardDuration = cardSessions.reduce((acc, s) => acc + s.duration, 0);
        const cardCompleted = cardTodos.filter(t => t.completed).length;

        return { cardSessions, cardTodos, cardDuration, cardCompleted };
    };

    const { cardSessions, cardTodos, cardDuration, cardCompleted } = getShareStats();

    const applyAdFreeReward = () => {
        // Grant 24 Hours of Ad-Free
        const expiration = new Date();
        expiration.setHours(expiration.getHours() + 24);
        localStorage.setItem("adFreeUntil", expiration.toISOString());

        // Dispatch event to notify AdBanner/AppShell to re-check
        window.dispatchEvent(new Event("adFreeStatusChanged"));
    };

    const handleShare = async (platform: 'x' | 'facebook' | 'reddit' | 'discord' | 'instagram' | 'download') => {
        if (!shareCardRef.current || isSharing) return;
        setIsSharing(true);

        // Pre-open window to avoid popup blockers (for non-download/insta actions)
        let newWindow: Window | null = null;
        if (platform !== 'instagram' && platform !== 'download') {
            newWindow = window.open('', '_blank');
            if (newWindow) {
                // write loading message
                newWindow.document.write(`
                    <html>
                        <head><title>PomArc Share</title></head>
                        <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#f9fafb;">
                            <div style="text-align:center;">
                                <h2 style="color:#374151;">Generating image...</h2>
                                <p style="color:#6b7280;">Please wait a moment.</p>
                            </div>
                        </body>
                    </html>
                 `);
                // Return focus to main window to ensure clipboard API works
                window.focus();
            }
        }

        // 1. Generate Image
        try {
            if (platform === 'instagram' || platform === 'download') {
                await downloadImage(shareCardRef.current, `pomarc-stats-${format(new Date(), 'yyyyMMdd')}.png`);
                if (platform === 'instagram') {
                    window.open('https://www.instagram.com/', '_blank');
                    applyAdFreeReward();
                }
            } else {
                const success = await generateAndCopyImage(shareCardRef.current);
                if (!success) {
                    if (newWindow) newWindow.close();
                    alert("画像の生成に失敗しました。");
                    setIsSharing(false);
                    return;
                }

                // 2. Open URL
                let url = '';
                const text = `I've focused for ${Math.floor(cardDuration / 60)} mins on PomArc! streak: ${streak.currentStreak} days. #PomArc #Pomodoro`;
                const encodedText = encodeURIComponent(text);

                switch (platform) {
                    case 'x':
                        url = `https://twitter.com/intent/tweet?text=${encodedText}`;
                        break;
                    case 'facebook':
                        url = `https://www.facebook.com/sharer/sharer.php?u=https://pomarc.app`; // FB only allows URL share
                        break;
                    case 'reddit':
                        url = `https://www.reddit.com/submit?title=${encodedText}`;
                        break;
                    case 'discord':
                        url = `https://discord.com/app`; // Open Web App
                        break;
                }

                if (newWindow) {
                    newWindow.location.href = url;
                }

                // 3. Grant Reward
                applyAdFreeReward();
            }
        } catch (e) {
            console.error(e);
            if (newWindow) newWindow.close();
            alert("エラーが発生しました。");
        } finally {
            setIsSharing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity p-4">
            <div className="w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setActiveTab("analytics")}
                            className={`flex items-center space-x-2 pb-2 border-b-2 transition-colors ${activeTab === "analytics" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                        >
                            <BarChart2 size={18} />
                            <span className="text-sm font-bold">{t("analytics")}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`flex items-center space-x-2 pb-2 border-b-2 transition-colors ${activeTab === "history" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                        >
                            <History size={18} />
                            <span className="text-sm font-bold">{t("history")}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("share")}
                            className={`flex items-center space-x-2 pb-2 border-b-2 transition-colors ${activeTab === "share" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                        >
                            <Share2 size={18} />
                            <span className="text-sm font-bold">{t("share")}</span>
                        </button>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 min-h-0">
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
                                    <div className="text-sm text-gray-500 font-medium mb-1">{t("totalFocusTime")}</div>
                                    <div className="text-3xl font-bold text-gray-800">
                                        {totalDurationHours}<span className="text-lg font-normal text-gray-500 ml-1">h</span>
                                        {totalDurationMinutes}<span className="text-lg font-normal text-gray-500 ml-1">m</span>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="text-sm text-gray-500 font-medium mb-1">{t("completedTasks")}</div>
                                    <div className="text-3xl font-bold text-gray-800">
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
                                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">{t("focusTrend")}</h3>
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
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">{t("categoryDistribution")}</h3>
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
                    ) : activeTab === "history" ? (
                        <div className="space-y-4">
                            {/* Filters */}
                            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center space-x-2 text-gray-500">
                                    <Filter size={18} />
                                    <span className="text-sm font-medium">{t("filters")}</span>
                                </div>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as "all" | "completed" | "incomplete")}
                                    className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                                >
                                    <option value="all">{t("allStatus")}</option>
                                    <option value="completed">{t("completed")}</option>
                                    <option value="incomplete">{t("incomplete")}</option>
                                </select>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                                >
                                    <option value="all">{t("allCategories")}</option>
                                    {flatCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option> // Use cat.id
                                    ))}
                                </select>
                            </div>

                            {/* Todo List Header with Bulk Actions */}
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-gray-700">{t("tasks")}</h3>
                                {selectedIds.size > 0 && (
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setSelectedIds(new Set())}
                                            className="text-gray-500 text-xs font-bold hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                                        >
                                            {tc("cancel")}
                                        </button>
                                        <button
                                            onClick={handleBulkDeleteClick}
                                            className="text-red-500 text-xs font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                        >
                                            {t("deleteSelected", { count: selectedIds.size })}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Todo List */}
                            <div className="space-y-2">
                                {timelineItems.map(item => {
                                    if ('type' in item && item.type === 'group') {
                                        const isExpanded = expandedGroups.has(item.id);
                                        const allCompleted = item.todos.every(t => t.completed);
                                        const groupSelected = item.todos.length > 0 && item.todos.every(t => selectedIds.has(t.id));

                                        return (
                                            <div key={item.id} className="space-y-1">
                                                {/* Group Header */}
                                                <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-blue-200 transition-colors">
                                                    <div className="flex items-center space-x-3 flex-1 overflow-hidden">
                                                        <input
                                                            type="checkbox"
                                                            checked={groupSelected}
                                                            onChange={() => {
                                                                const next = new Set(selectedIds);
                                                                if (groupSelected) {
                                                                    item.todos.forEach(t => next.delete(t.id));
                                                                } else {
                                                                    item.todos.forEach(t => next.add(t.id));
                                                                }
                                                                setSelectedIds(next);
                                                            }}
                                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2"
                                                        />
                                                        <div className={`w-2 h-12 rounded-full flex-shrink-0 ${allCompleted ? "bg-green-500" : "bg-gray-300"}`} />
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Parent checks group toggle if wrapped, here used for group toggle
                                                                toggleGroup(item.id);
                                                            }}
                                                            className="flex items-center space-x-3 text-left flex-1 overflow-hidden"
                                                        >
                                                            <div className="p-1 px-2 bg-purple-100 text-purple-600 rounded text-[10px] font-bold flex items-center space-x-1 shrink-0">
                                                                <Layers size={10} />
                                                                <span>{item.todos.length}</span>
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <div className="font-bold text-gray-800 flex items-center truncate">
                                                                    <TodoTitle title={item.title} />
                                                                    {isExpanded ? <ChevronDown size={16} className="ml-1 shrink-0" /> : <ChevronRight size={16} className="ml-1 shrink-0" />}
                                                                </div>
                                                                <div className="text-[10px] text-gray-400 truncate">
                                                                    {item.completedCount}/{item.todos.length} {tc("completed")} • {format(item.createdAt, "yyyy/MM/dd HH:mm")}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm(tc("deleteGroupConfirm", { count: item.todos.length }))) {
                                                                try {
                                                                    await onBulkDelete(item.todos.map(t => t.id));
                                                                } catch (e) {
                                                                    console.error("Group delete failed", e);
                                                                }
                                                            }
                                                        }}
                                                        className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>

                                                {/* Group Content (Accordion) */}
                                                {isExpanded && (
                                                    <div className="ml-8 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        {item.todos.map(todo => (
                                                            <div key={todo.id} className="bg-white/50 p-3 rounded-xl border border-gray-100 flex items-center justify-between group hover:border-blue-200 transition-colors">
                                                                <div className="flex items-center space-x-3">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedIds.has(todo.id)}
                                                                        onChange={() => toggleSelect(todo.id)}
                                                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2"
                                                                    />
                                                                    <div className={`w-1 h-8 rounded-full ${todo.completed ? "bg-green-500" : "bg-gray-300"}`} />
                                                                    <div
                                                                        onClick={() => onOpenTodoDetail(todo)}
                                                                        className="cursor-pointer hover:underline decoration-blue-500"
                                                                    >
                                                                        <div className="text-sm font-medium text-gray-700">
                                                                            <TodoTitle title={todo.title} />
                                                                        </div>
                                                                        <div className="text-xs text-gray-400">
                                                                            {format(new Date(todo.dueDate || todo.createdAt), "MM/dd")} {todo.dueTime || ""}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDeleteClick(todo.id)}
                                                                    className={`p-1.5 rounded-full transition-colors ${deleteConfirmId === todo.id ? "bg-red-50 text-red-600 opacity-100" : "text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100"}`}
                                                                >
                                                                    {deleteConfirmId === todo.id ? <Trash2 size={14} fill="currentColor" /> : <Trash2 size={14} />}
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    const todo = item as Todo;
                                    return (
                                        <div key={todo.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-blue-200 transition-colors">
                                            <div className="flex items-center space-x-3">
                                                {/* Checkbox */}
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(todo.id)}
                                                    onChange={() => toggleSelect(todo.id)}
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2"
                                                />
                                                <div className={`w-2 h-12 rounded-full ${todo.completed ? "bg-green-500" : "bg-gray-300"}`} />
                                                <div
                                                    onClick={() => onOpenTodoDetail(todo)}
                                                    className="cursor-pointer flex-1 min-w-0" // Add flex-1 min-w-0 for truncating if needed
                                                >
                                                    <div className="font-bold text-gray-800 hover:text-blue-600 transition-colors">
                                                        <TodoTitle title={todo.title} />
                                                    </div>
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
                                                className={`p-2 rounded-full transition-colors ${deleteConfirmId === todo.id ? "bg-red-50 text-red-600 opacity-100" : "text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100"}`}
                                            >
                                                {deleteConfirmId === todo.id ? <Trash2 size={18} fill="currentColor" /> : <Trash2 size={18} />}
                                            </button>
                                        </div>
                                    );
                                })}
                                {filteredTodos.length === 0 && (
                                    <div className="text-center py-12 text-gray-400">
                                        {t("noTasksFound")}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // --- Share Tab ---
                        <div className="flex flex-col lg:flex-row gap-8 h-full">
                            {/* Left: Preview */}
                            <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 rounded-xl p-4 overflow-hidden min-h-[400px]">
                                <div className="scale-50 sm:scale-75 md:scale-90 transform-origin-center transition-transform">
                                    <ShareCard
                                        ref={shareCardRef}
                                        sessions={cardSessions} // Use filtered
                                        todos={cardTodos}       // Use filtered
                                        categories={flatCategories}
                                        streak={streak}
                                        targetCategory={targetShareCategory}
                                        totalDuration={cardDuration}
                                        completedCount={cardCompleted}
                                        userName="PomArc Member"
                                    />
                                </div>
                            </div>

                            {/* Right: Controls */}
                            <div className="w-full lg:w-80 flex flex-col space-y-6 flex-shrink-0">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">{t("selectCategory")}</label>
                                    <select
                                        value={targetShareCategory}
                                        onChange={(e) => setTargetShareCategory(e.target.value)}
                                        className="w-full bg-white border border-gray-200 text-gray-700 rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3"
                                    >
                                        <option value="all">{t("allActivities")}</option>
                                        {flatCategories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-700">{t("shareSocial")}</h3>
                                    <p className="text-xs text-gray-500">{t("shareSocialDesc")}</p>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleShare('x')}
                                            disabled={isSharing}
                                            className="flex items-center justify-center space-x-2 bg-black text-white p-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                                        >
                                            <Twitter size={20} />
                                            <span>X (Twitter)</span>
                                        </button>

                                        <button
                                            onClick={() => handleShare('facebook')}
                                            disabled={isSharing}
                                            className="flex items-center justify-center space-x-2 bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            <Facebook size={20} />
                                            <span>Facebook</span>
                                        </button>

                                        <button
                                            onClick={() => handleShare('reddit')}
                                            disabled={isSharing}
                                            className="flex items-center justify-center space-x-2 bg-orange-600 text-white p-3 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50"
                                        >
                                            <div className="w-5 h-5 rounded-full bg-white text-orange-600 font-bold flex items-center justify-center text-xs">r</div>
                                            <span>Reddit</span>
                                        </button>

                                        <button
                                            onClick={() => handleShare('discord')}
                                            disabled={isSharing}
                                            className="flex items-center justify-center space-x-2 bg-indigo-500 text-white p-3 rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50"
                                        >
                                            <Hash size={20} />
                                            <span>Discord</span>
                                        </button>
                                        <button
                                            onClick={() => handleShare('instagram')}
                                            disabled={isSharing}
                                            className="col-span-2 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                                        >
                                            <Instagram size={20} />
                                            <span>Instagram (Downlaod)</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <button
                                        onClick={() => handleShare('download')}
                                        disabled={isSharing}
                                        className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 p-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                                    >
                                        <Download size={20} />
                                        <span>{t("downloadOnly")}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
