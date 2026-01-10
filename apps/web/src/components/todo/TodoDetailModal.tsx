"use client";

import React, { useState } from "react";
import { X, Play, Calendar, Clock, Tag, Repeat, FileText, Flag, CheckCircle, Save } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Todo, Category, SRSProfile } from "@pomarc/shared";

interface TodoDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    todo: Todo | null;
    categories: Category[];
    srsProfiles?: SRSProfile[]; // Added for parity
    onStartNow: (todo: Todo) => void;
    onDelete: (todoId: string) => void;
    onUpdate: (todo: Todo, options?: { applySrs?: boolean }) => void; // Added options for SRS generation
    onRecord: (todo: Todo, duration: number) => void;
}

export function TodoDetailModal({
    isOpen,
    onClose,
    todo,
    categories,
    srsProfiles = [],
    onStartNow,
    onDelete,
    onUpdate,
    onRecord
}: TodoDetailModalProps) {
    // Edit States
    const [content, setContent] = useState("");
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [dueTime, setDueTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [srsInterval, setSrsInterval] = useState("");
    // Priority removed from UI but kept in state/logic if needed, or default to medium
    const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

    // Existing states
    const [isRecording, setIsRecording] = useState(false);
    const [recordDuration, setRecordDuration] = useState("");

    const t = useTranslations("todo");
    const tc = useTranslations("common");

    // Initialize states when todo is opened
    React.useEffect(() => {
        if (todo && isOpen) {
            // content = title + \n + memo
            const initialContent = todo.memo ? `${todo.title}\n${todo.memo}` : todo.title;
            setContent(initialContent);
            setCategoryId(todo.categoryId || "");
            setDueDate(todo.dueDate ? new Date(todo.dueDate) : null);
            setDueTime(todo.dueTime || "");
            setEndTime(todo.endTime || "");
            setSrsInterval(todo.srsInterval || "");
            setPriority(todo.priority || "medium");
        }
    }, [todo, isOpen]);

    const sessions = useLiveQuery(
        async () => {
            if (!todo) return [];
            return await db.sessions.where("todoId").equals(todo.id).toArray();
        },
        [todo?.id]
    ) || [];

    if (!isOpen || !todo) return null;

    // カテゴリ選択肢の平坦化
    const getCategoryOptions = () => {
        const options: { value: string; label: string }[] = [];
        const traverse = (cats: Category[], prefix = "") => {
            cats.forEach(cat => {
                const label = prefix ? `${prefix} > ${cat.name}` : cat.name;
                options.push({ value: cat.id, label });
                if (cat.children) traverse(cat.children, label);
            });
        };
        traverse(categories);
        return options;
    };

    const categoryOptions = getCategoryOptions();

    // 自由記述欄のパース（CreateModalと同じロジック）
    const parseContent = () => {
        const lines = content.split("\n");
        const rawTitle = lines[0].trim();
        const notes = lines.slice(1).join("\n").trim();

        let effectiveTitle = rawTitle;
        if (!effectiveTitle && categoryId) {
            const cat = categoryOptions.find(c => c.value === categoryId);
            if (cat) effectiveTitle = cat.label.split(" > ").pop() || cat.label;
        }

        return {
            title: effectiveTitle || t("noTitle"),
            notes: notes || undefined
        };
    };

    // 優先度の表示名とカラー
    const getPriorityDisplay = (priority?: string) => {
        switch (priority) {
            case "high": return { label: t("priorityHigh"), color: "text-red-500 bg-red-50 dark:bg-red-900/30" };
            case "medium": return { label: t("priorityMedium"), color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30" };
            case "low": return { label: t("priorityLow"), color: "text-green-500 bg-green-50 dark:bg-green-900/30" };
            default: return null;
        }
    };

    const handleUpdate = () => {
        if (!todo) return;
        const { title: parsedTitle, notes } = parseContent();

        onUpdate({
            ...todo,
            title: parsedTitle,
            memo: notes,
            categoryId: categoryId || undefined,
            dueDate: dueDate || undefined,
            dueTime: dueTime || undefined,
            endTime: endTime || undefined,
            srsInterval: srsInterval || undefined,
            priority,
            updatedAt: new Date(),
        };

        // SRS Logic: Check if newly added
        let applySrs = false;
        if (srsInterval && !todo.srsInterval && srsInterval !== "") {
            // New SRS set
            if (window.confirm("SRSプロファイルが設定されました。\n自動的に復習スケジュール(タスク)を生成しますか？")) {
                applySrs = true;
            }
        }

        onUpdate(updated, { applySrs });
        onClose();
    };

    const handleStartNow = () => {
        if (!todo) return;
        const { title: parsedTitle, notes } = parseContent();
        onStartNow({
            ...todo,
            title: parsedTitle,
            memo: notes,
            categoryId: categoryId || undefined,
            dueDate: dueDate || undefined,
            dueTime: dueTime || undefined,
            endTime: endTime || undefined,
            srsInterval: srsInterval || undefined,
            priority,
            updatedAt: new Date(),
        });
        onClose();
    };

    const handleDelete = () => {
        if (!todo) return;
        onDelete(todo.id);
        onClose();
    };

    const handleRecordSubmit = () => {
        if (!todo) return;
        const d = parseInt(recordDuration, 10);
        if (isNaN(d) || d <= 0) {
            alert(t("invalidDuration"));
            return;
        }

        const { title: parsedTitle, notes } = parseContent();
        onRecord({
            ...todo,
            title: parsedTitle,
            memo: notes,
            categoryId: categoryId || undefined,
            dueDate: dueDate || undefined,
            dueTime: dueTime || undefined,
            endTime: endTime || undefined,
            srsInterval: srsInterval || undefined,
            priority,
            updatedAt: new Date(),
        }, d * 60); // min -> sec

        setRecordDuration("");
        setIsRecording(false);
        onClose();
    };


    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t("detailTitle")}</h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleUpdate}
                            className="text-sm font-bold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1 rounded-lg transition-colors"
                        >
                            {tc("save")}
                        </button>
                        <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">

                    {/* Category Selection */}
                    <div className="flex items-center space-x-2">
                        <Tag size={18} className="text-gray-400" />
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="flex-1 bg-gray-50 dark:bg-gray-800 text-sm p-2 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <option value="">{t("noCategory")}</option>
                            {categoryOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Merged Content Input (Title & Memo) */}
                    <div className="flex items-start space-x-3">
                        <div className="mt-2.5">
                            {todo.completed ? (
                                <CheckCircle className="text-green-500" size={24} />
                            ) : (
                                <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                            )}
                        </div>
                        <textarea
                            placeholder={t("contentPlaceholder")}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={3}
                            className={`flex-1 text-lg font-bold bg-transparent border-none outline-none resize-none py-1 placeholder-gray-300 ${todo.completed ? "text-gray-400 line-through" : "text-gray-800 dark:text-gray-100"}`}
                        />
                    </div>

                    {/* Date/Time/SRS Grid (Compact like Create Modal) */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Due Date */}
                        <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                            <Calendar size={18} className="text-blue-500" />
                            <input
                                type="date"
                                value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""}
                                onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : null)}
                                className="bg-transparent text-sm w-full outline-none"
                            />
                        </div>

                        {/* Start Time */}
                        <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                            <Clock size={18} className="text-blue-500" />
                            <input
                                type="time"
                                value={dueTime}
                                onChange={(e) => setDueTime(e.target.value)}
                                className="bg-transparent text-sm w-full outline-none"
                            />
                        </div>

                        {/* SRS Profile */}
                        <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                            <Repeat size={18} className="text-green-500" />
                            <select
                                value={srsInterval}
                                onChange={(e) => setSrsInterval(e.target.value)}
                                className="bg-transparent text-sm w-full border-none outline-none"
                            >
                                <option value="">{t("noSrs")}</option>
                                {srsProfiles.map(p => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                    </select>
                </div>

                {/* Priority removed */}
            </div>

            {/* Stats Summary (Learning History) */}
            <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t("statsTitle")}</div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <Clock className="text-blue-500" size={20} />
                    <div className="flex-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t("results")}</div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {sessions.length}回 ({Math.floor(sessions.reduce((acc, s) => acc + s.duration, 0) / 60)}分)
                        </div>
                    </div>
                </div>
            </div>

        </div>

                {/* Actions */ }
    <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
        {isRecording ? (
            <div className="flex items-center space-x-2 animate-in slide-in-from-bottom duration-300">
                <input
                    type="number"
                    value={recordDuration}
                    onChange={(e) => setRecordDuration(e.target.value)}
                    placeholder={t("durationPlaceholder")}
                    className="flex-1 bg-gray-100 p-3 rounded-xl outline-none focus:ring-2 focus:ring-green-400"
                    autoFocus
                />
                <button
                    onClick={handleRecordSubmit}
                    className="bg-green-500 text-white p-3 rounded-xl font-bold"
                >
                    <Save size={20} />
                </button>
                <button
                    onClick={() => setIsRecording(false)}
                    className="bg-gray-200 text-gray-500 p-3 rounded-xl font-bold"
                >
                    <X size={20} />
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => setIsRecording(true)}
                    className="flex items-center justify-center space-x-2 bg-green-100 text-green-600 hover:bg-green-200 py-3 rounded-xl font-bold transition-colors"
                >
                    <CheckCircle size={20} />
                    <span>{t("record")}</span>
                </button>
                <button
                    onClick={handleStartNow}
                    className="flex items-center justify-center space-x-1 bg-orange-100 text-orange-600 hover:bg-orange-200 py-3 rounded-xl font-bold transition-colors"
                >
                    <Play size={18} fill="currentColor" />
                    <span>{t("start")}</span>
                </button>
            </div>
        )}

        {!isRecording && (
            <button
                onClick={handleDelete}
                className="w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 py-2 rounded-xl text-sm font-medium transition-colors"
            >
                {t("deleteTask")}
            </button>
        )}
    </div>
            </div >
        </div >
    );
}
