"use client";

import React, { useState, useEffect } from "react";
import { X, Tag, Repeat, BookOpen, FileText, Play, CheckCircle, Plus, PlayCircle, StopCircle, Hourglass } from "lucide-react";
import { format } from "date-fns";
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
    const [title, setTitle] = useState("");
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [dueTime, setDueTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [categoryId, setCategoryId] = useState(""); // Changed to categoryId
    const [srsInterval, setSrsInterval] = useState("");
    const [range, setRange] = useState("");
    const [memo, setMemo] = useState("");
    const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
    const [duration, setDuration] = useState<string>(""); // Duration in minutes

    // 繝｢繝ｼ繝繝ｫ縺碁幕縺・◆譎ゅ↓蛻晄悄蛟､繧定ｨｭ螳・
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

    // 繧ｫ繝・ざ繝ｪ縺ｮ繝輔Λ繝・ヨ蛹厄ｼ磯∈謚櫁い逕ｨ・・
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

    const getEffectiveTitle = () => {
        if (title.trim()) return title;
        // Find category name by ID
        if (categoryId) {
            const cat = categoryOptions.find(c => c.value === categoryId);
            if (cat) return cat.label.split(" > ").pop() || cat.label;
        }
        return "No Title";
    };

    // 譎る俣謖・ｮ壽凾縺ｮ譌･莉倩・蜍戊｣懷ｮ悟・逅・
    const ensureDateIfTimeSet = () => {
        if (dueTime && !dueDate) {
            return new Date();
        }
        return dueDate;
    };

    // 繝輔か繝ｼ繝騾∽ｿ｡譎ゅ・蜃ｦ逅・
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const effectiveTitle = getEffectiveTitle();
        const effectiveDate = ensureDateIfTimeSet();

        onCreate({
            title: effectiveTitle,
            dueDate: effectiveDate || undefined,
            dueTime: dueTime || undefined,
            endTime: endTime || undefined,
            categoryId: categoryId || undefined, // Use categoryId
            srsInterval,
            range,
            memo,
            priority,
            updatedAt: new Date(), // Added
        });
        resetForm();
    };

    // 縲御ｻ翫☆縺宣幕蟋九阪・繧ｿ繝ｳ縺ｮ蜃ｦ逅・
    const handleStartNow = () => {
        const effectiveTitle = getEffectiveTitle();
        const now = new Date();
        onStartNow({
            title: effectiveTitle,
            dueDate: now,
            dueTime: format(now, "HH:mm"),
            // StartNow doesn't need endTime usually, as it's ongoing
            categoryId: categoryId || undefined, // Use categoryId
            srsInterval,
            range,
            memo,
            priority,
            updatedAt: new Date(), // Added
        });
        resetForm();
    };

    // 縲瑚ｨ倬鹸縲阪・繧ｿ繝ｳ縺ｮ蜃ｦ逅・
    const handleRecord = () => {
        const effectiveTitle = getEffectiveTitle();
        const durationNum = parseInt(duration, 10);
        if (isNaN(durationNum) || durationNum <= 0) {
            alert("譛牙柑縺ｪ譎る俣繧貞・蜉帙＠縺ｦ縺上□縺輔＞");
            return;
        }

        // Record uses the selected date/time if available
        const effectiveDate = ensureDateIfTimeSet();

        onRecord({
            title: effectiveTitle,
            dueDate: effectiveDate || undefined,
            dueTime: dueTime || undefined,
            endTime: endTime || undefined,
            categoryId: categoryId || undefined, // Use categoryId
            srsInterval,
            range,
            memo,
            priority,
            updatedAt: new Date(), // Added
        }, durationNum * 60); // Convert minutes to seconds
        resetForm();
    };

    const resetForm = () => {
        setTitle("");
        setDueDate(null);
        setDueTime("");
        setEndTime("");
        setCategoryId(""); // Reset categoryId
        setSrsInterval("");
        setRange("");
        setMemo("");
        setPriority("medium");
        setDuration("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Todo菴懈・</h2>
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
                            <option value="" className="text-gray-500">繧ｫ繝・ざ繝ｪ縺ｪ縺・/option>
                            {categoryOptions.map((opt) => (
                                <option key={opt.value} value={opt.value} className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800">
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Title Input (Optional) */}
                    <div>
                        <input
                            type="text"
                            placeholder="繧ｿ繧ｹ繧ｯ蜷・(莉ｻ諢・"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full text-lg font-medium border-b-2 border-blue-100 focus:border-blue-500 outline-none py-2 placeholder-gray-300"
                        />
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Date */}
                        <DatePicker
                            value={dueDate}
                            onChange={setDueDate}
                            placeholder="[譌･莉倥ｒ驕ｸ謚枉"
                        />

                        {/* Start Time */}
                        <TimePicker
                            value={dueTime}
                            onChange={(val) => {
                                setDueTime(val);
                                if (!val) setEndTime(""); // Reset end time if start time cleared
                            }}
                            placeholder="髢句ｧ区凾髢・
                            icon={<PlayCircle size={18} className="text-blue-500" />}
                        />

                        {/* Duration (Record Only) - Swapped with EndTime */}
                        <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                            <Hourglass size={18} className="text-orange-500" />
                            <input
                                type="number"
                                min="1"
                                placeholder="謇隕∵凾髢・蛻・"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="bg-transparent text-sm w-full outline-none text-gray-700 placeholder-gray-400"
                            />
                        </div>

                        {/* End Time (Disabled if no start time) - Swapped with Duration */}
                        <TimePicker
                            value={endTime}
                            onChange={setEndTime}
                            placeholder="邨ゆｺ・凾髢・
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
                                <option value="">SRS縺ｪ縺・/option>
                                {srsProfiles.map((profile) => (
                                    <option key={profile.id} value={profile.name}>
                                        {profile.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Range & Memo */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2 border-b border-gray-100 py-1">
                            <BookOpen size={18} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="遽・峇 (萓・ p.10-20)"
                                value={range}
                                onChange={(e) => setRange(e.target.value)}
                                className="flex-1 text-sm outline-none placeholder-gray-300"
                            />
                        </div>
                        <div className="flex items-center space-x-2 border-b border-gray-100 py-1">
                            <FileText size={18} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="繝｡繝｢"
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                className="flex-1 text-sm outline-none placeholder-gray-300"
                            />
                        </div>
                    </div>

                    {/* Action Buttons (Reordered: Record -> Start -> Create) */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                        <button
                            type="button"
                            onClick={handleRecord}
                            className="flex items-center justify-center space-x-1 bg-green-100 text-green-600 py-3 rounded-xl font-bold hover:bg-green-200 transition-colors"
                        >
                            <CheckCircle size={18} />
                            <span className="text-sm">險倬鹸</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleStartNow}
                            className="flex items-center justify-center space-x-1 bg-orange-100 text-orange-600 py-3 rounded-xl font-bold hover:bg-orange-200 transition-colors"
                        >
                            <Play size={18} fill="currentColor" />
                            <span className="text-sm">髢句ｧ・/span>
                        </button>
                        <button
                            type="submit"
                            className="flex items-center justify-center space-x-1 bg-blue-100 text-blue-600 py-3 rounded-xl font-bold hover:bg-blue-200 transition-colors"
                        >
                            <Plus size={18} />
                            <span className="text-sm">菴懈・</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
