"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Trash2, Filter, ChevronDown, ChevronRight, Layers } from "lucide-react";
import { Session, Todo, Category } from "@studytodo/shared";
import { TodoTitle } from "@/components/ui/TodoTitle";
import { useTranslations } from "next-intl";

interface HistoryTabProps {
    todos: Todo[];
    flatCategories: Category[];
    onDeleteTodo: (todoId: string) => void;
    onBulkDelete: (ids: string[]) => Promise<void>;
    onOpenTodoDetail: (todo: Todo) => void;
}

export function HistoryTab({ todos, flatCategories, onDeleteTodo, onBulkDelete, onOpenTodoDetail }: HistoryTabProps) {
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "incomplete">("all");
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center space-x-4 bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
                <div className="flex items-center space-x-2 text-gray-500">
                    <Filter size={18} />
                    <span className="text-sm font-medium">{t("filters")}</span>
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as "all" | "completed" | "incomplete")}
                    className="bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] block p-2.5"
                >
                    <option value="all">{t("allStatus")}</option>
                    <option value="completed">{t("completed")}</option>
                    <option value="incomplete">{t("incomplete")}</option>
                </select>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] block p-2.5"
                >
                    <option value="all">{t("allCategories")}</option>
                    {flatCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option> // Use cat.id
                    ))}
                </select>
            </div>

            {/* Todo List Header with Bulk Actions */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t("tasks")}</h3>
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
                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 flex items-center justify-between group hover:border-[var(--accent-primary)] transition-colors">
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
                                            className="w-4 h-4 rounded border-gray-300 focus:ring-[var(--accent-primary)] me-2"
                                                            style={{ accentColor: "var(--accent-primary)" }}
                                        />
                                        <div className={`w-2 h-12 rounded-full flex-shrink-0 ${allCompleted ? "bg-green-500" : "bg-gray-300"}`} />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Parent checks group toggle if wrapped, here used for group toggle
                                                toggleGroup(item.id);
                                            }}
                                            className="flex items-center space-x-3 text-start flex-1 overflow-hidden"
                                        >
                                            <div className="p-1 px-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-[10px] font-bold flex items-center space-x-1 shrink-0">
                                                <Layers size={10} />
                                                <span>{item.todos.length}</span>
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="font-bold text-gray-800 dark:text-gray-100 flex items-center truncate">
                                                    <TodoTitle title={item.title} />
                                                    {isExpanded ? <ChevronDown size={16} className="ms-1 shrink-0" /> : <ChevronRight size={16} className="ms-1 shrink-0" />}
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
                                    <div className="ms-8 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                        {item.todos.map(todo => (
                                            <div key={todo.id} className="bg-white/50 dark:bg-gray-600/50 p-3 rounded-xl border border-gray-100 dark:border-gray-500 flex items-center justify-between group hover:border-[var(--accent-primary)] transition-colors">
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(todo.id)}
                                                        onChange={() => toggleSelect(todo.id)}
                                                        className="w-4 h-4 rounded border-gray-300 focus:ring-[var(--accent-primary)] me-2"
                                                            style={{ accentColor: "var(--accent-primary)" }}
                                                    />
                                                    <div className={`w-1 h-8 rounded-full ${todo.completed ? "bg-green-500" : "bg-gray-300"}`} />
                                                    <div
                                                        onClick={() => onOpenTodoDetail(todo)}
                                                        className="cursor-pointer hover:underline decoration-[var(--accent-primary)]"
                                                    >
                                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
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
                        <div key={todo.id} className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 flex items-center justify-between group hover:border-[var(--accent-primary)] transition-colors">
                            <div className="flex items-center space-x-3">
                                {/* Checkbox */}
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(todo.id)}
                                    onChange={() => toggleSelect(todo.id)}
                                    className="w-4 h-4 rounded border-gray-300 focus:ring-[var(--accent-primary)] me-2"
                                                            style={{ accentColor: "var(--accent-primary)" }}
                                />
                                <div className={`w-2 h-12 rounded-full ${todo.completed ? "bg-green-500" : "bg-gray-300"}`} />
                                <div
                                    onClick={() => onOpenTodoDetail(todo)}
                                    className="cursor-pointer flex-1 min-w-0" // Add flex-1 min-w-0 for truncating if needed
                                >
                                    <div className="font-bold text-gray-800 dark:text-gray-100 hover:text-[var(--accent-primary)] transition-colors">
                                        <TodoTitle title={todo.title} />
                                    </div>
                                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <span className="bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded">
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
    );
}
