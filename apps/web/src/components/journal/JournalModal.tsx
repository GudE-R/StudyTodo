"use client";

import React, { useState } from "react";
import { X, Send, BookOpen, GraduationCap, Lightbulb, Trophy, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useJournal } from "@/hooks/useJournal";
import { JournalPost } from "@studytodo/shared";

interface JournalModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TYPE_CONFIG = {
    note: { icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/30" },
    learning: { icon: GraduationCap, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/30" },
    reflection: { icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/30" },
    milestone: { icon: Trophy, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/30" },
} as const;

const MOODS = [
    { value: "great", emoji: "\u{1F604}" },
    { value: "good", emoji: "\u{1F642}" },
    { value: "neutral", emoji: "\u{1F610}" },
    { value: "bad", emoji: "\u{1F61F}" },
    { value: "terrible", emoji: "\u{1F622}" },
] as const;

type PostType = JournalPost["type"];
type MoodType = NonNullable<JournalPost["mood"]>;

export function JournalModal({ isOpen, onClose }: JournalModalProps) {
    const t = useTranslations("journal");
    const { posts, addPost, deletePost } = useJournal();
    const [content, setContent] = useState("");
    const [postType, setPostType] = useState<PostType>("note");
    const [mood, setMood] = useState<MoodType | undefined>(undefined);

    const handleSubmit = async () => {
        if (!content.trim()) return;
        await addPost({
            content: content.trim(),
            type: postType,
            mood,
        });
        setContent("");
        setMood(undefined);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm(t("deleteConfirm"))) {
            await deletePost(id);
        }
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity p-4">
            <div className="w-full max-w-2xl h-[85vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                        <BookOpen size={20} className="text-blue-500" />
                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t("title")}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Composer */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-3">
                    {/* Type Selector */}
                    <div className="flex space-x-2">
                        {(Object.keys(TYPE_CONFIG) as PostType[]).map((type) => {
                            const config = TYPE_CONFIG[type];
                            const Icon = config.icon;
                            const selected = postType === type;
                            return (
                                <button
                                    key={type}
                                    onClick={() => setPostType(type)}
                                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                        selected
                                            ? `${config.bg} ${config.color} ring-1 ring-current`
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    <Icon size={14} />
                                    <span>{t(`type${type.charAt(0).toUpperCase() + type.slice(1)}`)}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Input + Mood + Send */}
                    <div className="flex items-end space-x-2">
                        <div className="flex-1">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={t("placeholder")}
                                maxLength={2000}
                                rows={2}
                                className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                        handleSubmit();
                                    }
                                }}
                            />
                        </div>
                        <div className="flex flex-col items-center space-y-1">
                            <div className="flex space-x-0.5">
                                {MOODS.map((m) => (
                                    <button
                                        key={m.value}
                                        onClick={() => setMood(mood === m.value ? undefined : m.value as MoodType)}
                                        className={`text-lg p-0.5 rounded transition-all ${
                                            mood === m.value ? "scale-125 bg-gray-200 dark:bg-gray-600" : "opacity-50 hover:opacity-100"
                                        }`}
                                    >
                                        {m.emoji}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={!content.trim()}
                                className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {posts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <BookOpen size={48} className="mb-2 opacity-30" />
                            <p className="text-sm">{t("empty")}</p>
                        </div>
                    ) : (
                        posts.map((post) => {
                            const config = TYPE_CONFIG[post.type] || TYPE_CONFIG.note;
                            const Icon = config.icon;
                            return (
                                <div key={post.id} className="group flex space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.bg} flex items-center justify-center`}>
                                        <Icon size={16} className={config.color} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-400">{formatTime(post.createdAt)}</span>
                                            <div className="flex items-center space-x-2">
                                                {post.mood && <span className="text-sm">{MOODS.find(m => m.value === post.mood)?.emoji}</span>}
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">{post.content}</p>
                                        {post.tags && post.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {post.tags.map((tag, i) => (
                                                    <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">#{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
