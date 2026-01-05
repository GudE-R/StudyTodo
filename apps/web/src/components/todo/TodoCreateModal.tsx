"use client";

import React, { useState, useEffect } from "react";
import { X, Tag, Repeat, BookOpen, FileText, Play, CheckCircle, Plus, PlayCircle, StopCircle, Hourglass } from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { Todo, Category, SRSProfile } from "@pomarc/shared";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "@/components/ui/TimePicker";

interface TodoCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (todo: Omit<Todo, "id" | "createdAt" | "completed">) => void;
    onStartNow: (todo: Omit<Todo, "id" | "createdAt" | "completed">) => void;
    onRecord: (todo: Omit<Todo, "id" | "createdAt" | "completed">, duration: number) => void;
    categories: Category[];
    srsProfiles: SRSProfile[];
    initialDate?: Date | null;
    initialTime?: string | null;
}

export function TodoCreateModal({
    isOpen,
    onClose,
    onCreate,
    onStartNow,
    onRecord,
    categories,
    srsProfiles,
    initialDate,
    initialTime
}: TodoCreateModalProps) {
    const [content, setContent] = useState("");
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [dueTime, setDueTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [srsInterval, setSrsInterval] = useState("");
    const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
    const [duration, setDuration] = useState<string>("");
    const [isRecordMode, setIsRecordMode] = useState(false);

    const t = useTranslations("todo");
    const tc = useTranslations("common");

    // モーダルが開いた時に初期値を設定
    useEffect(() => {
        if (isOpen) {
            if (initialDate) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setDueDate(initialDate);
            } else {
                setDueDate(null);
            }

            if (initialTime) {
                setDueTime(initialTime);
            } else {
                setDueTime("");
            }
            setEndTime("");
        }
    }, [isOpen, initialDate, initialTime]);

    if (!isOpen) return null;

    // カテゴリのフラット化（選択肢用）
    const getCategoryOptions = () => {
        const options: { value: string; label: string }[] = [];
        const traverse = (cats: Category[], prefix: string = "") => {
            cats.forEach(cat => {
                const label = prefix ? `${prefix} > ${cat.name}` : cat.name;
                options.push({ value: cat.id, label }); // Use cat.id as value
                if (cat.children && cat.children.length > 0) {
                    traverse(cat.children, label);
                }
            });
        };
        traverse(categories);
        return options;
    };

    const categoryOptions = getCategoryOptions();

    // 自由記述欄のパース（1行目: タイトル, 2行目以降: メモ）
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
            title: effectiveTitle || "",
            notes: notes || undefined
        };
    };

    // Validation: title or category must be provided
    const isValid = () => {
        const rawTitle = content.split("\n")[0].trim();
        return rawTitle.length > 0 || categoryId.length > 0;
    };

    // 時間指定時の日付自動補完処理
    const ensureDateIfTimeSet = (): Date | undefined => {
        if (dueTime && !dueDate) {
            return new Date();
        }
        return dueDate ?? undefined;
    };

    // フォーム送信時の処理
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid()) {
            alert(t("titleOrCategoryRequired"));
            return;
        }
        const { title: parsedTitle, notes } = parseContent();
        // Only set dueDate if time is also set, otherwise just add to todolist
        const effectiveDate = dueTime ? ensureDateIfTimeSet() : (dueDate ?? undefined);

        onCreate({
            title: parsedTitle || t("noTitle"),
            dueDate: effectiveDate,
            dueTime: dueTime || undefined,
            endTime: endTime || undefined,
            categoryId: categoryId || undefined,
            srsInterval,
            memo: notes,
            priority,
            updatedAt: new Date(),
        });
        resetForm();
    };

    // 「今すぐ開始」ボタンの処理
    const handleStartNow = () => {
        if (!isValid()) {
            alert(t("titleOrCategoryRequired"));
            return;
        }
        const { title: parsedTitle, notes } = parseContent();
        const now = new Date();
        onStartNow({
            title: parsedTitle || t("noTitle"),
            dueDate: now,
            dueTime: format(now, "HH:mm"),
            categoryId: categoryId || undefined,
            srsInterval,
            memo: notes,
            priority,
            updatedAt: new Date(),
        });
        resetForm();
    };

    // 「記録」ボタンの処理
    const handleRecord = () => {
        if (!isValid()) {
            alert(t("titleOrCategoryRequired"));
            return;
        }
        const { title: parsedTitle, notes } = parseContent();
        const durationNum = parseInt(duration, 10) || 0;

        // Record uses the selected date/time if available
        const effectiveDate = dueTime ? ensureDateIfTimeSet() : (dueDate ?? undefined);

        onRecord({
            title: parsedTitle || t("noTitle"),
            dueDate: effectiveDate,
            dueTime: dueTime || undefined,
            endTime: endTime || undefined,
            categoryId: categoryId || undefined,
            srsInterval,
            memo: notes,
            priority,
            updatedAt: new Date(),
        }, durationNum * 60);
        resetForm();
    };

    const resetForm = () => {
        setContent("");
        setDueDate(null);
        setDueTime("");
        setEndTime("");
        setCategoryId("");
        setSrsInterval("");
        setPriority("medium");
        setDuration("");
        setIsRecordMode(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">{t("createTitle")}</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Category (Moved to top) */}
                    <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                        <Tag size={18} className="text-gray-500" />
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="bg-transparent text-sm w-full outline-none text-gray-700 dark:text-gray-200 cursor-pointer"
                        >
                            <option value="" className="text-gray-500">{t("noCategory")}</option>
                            {categoryOptions.map((opt) => (
                                <option key={opt.value} value={opt.value} className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Content Input (Merged Title, Range, Memo) */}
                    <div>
                        <textarea
                            placeholder={t("contentPlaceholder")}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={3}
                            className="w-full text-base font-medium border-b-2 border-blue-100 focus:border-blue-500 outline-none py-2 placeholder-gray-300 resize-none bg-transparent"
                        />
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Date */}
                        <DatePicker
                            value={dueDate}
                            onChange={setDueDate}
                            placeholder={t("datePlaceholder")}
                        />

                        {/* Start Time */}
                        <TimePicker
                            value={dueTime}
                            onChange={(val) => {
                                setDueTime(val);
                                if (!val) setEndTime(""); // Reset end time if start time cleared
                            }}
                            placeholder={t("startTime")}
                            icon={<PlayCircle size={18} className="text-blue-500" />}
                        />

                        {/* Duration (Record Only) */}
                        {isRecordMode ? (
                            <div className="flex items-center space-x-2 bg-green-50 p-2 rounded-lg border border-green-200">
                                <Hourglass size={18} className="text-green-600" />
                                <input
                                    type="number"
                                    min="0"
                                    placeholder={t("durationPlaceholder")}
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="bg-transparent text-sm w-full outline-none text-gray-700 placeholder-gray-400"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-lg opacity-50">
                                <Hourglass size={18} className="text-gray-400" />
                                <span className="text-sm text-gray-400">{t("durationRecordOnly")}</span>
                            </div>
                        )}

                        {/* End Time (Disabled if no start time) - Swapped with Duration */}
                        <TimePicker
                            value={endTime}
                            onChange={setEndTime}
                            placeholder={t("endTime")}
                            disabled={!dueTime}
                            defaultTime={dueTime}
                            icon={<StopCircle size={18} className="text-red-500" />}
                        />

                        {/* SRS */}
                        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg col-span-2">
                            <Repeat size={18} className="text-gray-500" />
                            <select
                                value={srsInterval}
                                onChange={(e) => setSrsInterval(e.target.value)}
                                className="bg-transparent text-sm w-full outline-none text-gray-700 appearance-none"
                            >
                                <option value="">{t("noSrs")}</option>
                                {srsProfiles.map((profile) => (
                                    <option key={profile.id} value={profile.name}>
                                        {profile.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>


                    {/* Action Buttons (Reordered: Record -> Start -> Create) */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                if (isRecordMode) {
                                    handleRecord();
                                } else {
                                    setIsRecordMode(true);
                                }
                            }}
                            className={`flex items-center justify-center space-x-1 py-3 rounded-xl font-bold transition-colors ${isRecordMode
                                    ? "bg-green-600 text-white hover:bg-green-700"
                                    : "bg-green-100 text-green-600 hover:bg-green-200"
                                }`}
                        >
                            <CheckCircle size={18} />
                            <span className="text-sm">{isRecordMode ? t("recordConfirm") : t("record")}</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleStartNow}
                            className="flex items-center justify-center space-x-1 bg-orange-100 text-orange-600 py-3 rounded-xl font-bold hover:bg-orange-200 transition-colors"
                        >
                            <Play size={18} fill="currentColor" />
                            <span className="text-sm">{t("start")}</span>
                        </button>
                        <button
                            type="submit"
                            className="flex items-center justify-center space-x-1 bg-blue-100 text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-200 transition-colors"
                        >
                            <Plus size={18} />
                            <span className="text-sm">{t("create")}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
