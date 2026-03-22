"use client";

import React, { useState } from "react";
import { X, Send, MessageSquare, AlertCircle, Lightbulb, HelpCircle, LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Feedback } from "@studytodo/shared";
import { generateId } from "@/lib/utils";

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (feedback: Feedback) => Promise<void>;
}

export function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
    const [content, setContent] = useState("");
    const [type, setType] = useState<Feedback["type"]>("request");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const t = useTranslations("feedback");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const feedback: Feedback = {
                id: generateId(),
                content: content.trim(),
                type,
                deviceInfo: typeof window !== "undefined" ? window.navigator.userAgent : "web",
                version: "0.1.0",
                createdAt: new Date(),
            };
            await onSubmit(feedback);
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
                setContent("");
                setType("request");
            }, 2000);
        } catch (error) {
            console.error("Feedback submission failed:", error);
            alert(t("submitFailed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const types: { id: Feedback["type"]; label: string; icon: LucideIcon; color: string }[] = [
        { id: "request", label: t("typeRequest"), icon: Lightbulb, color: "text-yellow-500" },
        { id: "bug", label: t("typeBug"), icon: AlertCircle, color: "text-red-500" },
        { id: "other", label: t("typeOther"), icon: HelpCircle, color: "text-[var(--accent-primary)]" },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center space-x-2">
                        <MessageSquare size={20} style={{ color: "var(--accent-primary)" }} />
                        <h2 className="text-lg font-bold text-foreground">{t("title")}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {isSuccess ? (
                    <div className="p-10 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
                            <Send size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">{t("successTitle")}</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {t("successMessage")}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Type Selection */}
                        <div className="grid grid-cols-3 gap-3">
                            {types.map((t) => {
                                const Icon = t.icon;
                                const isSelected = type === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setType(t.id)}
                                        className={`
                                            flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all
                                            ${isSelected
                                                ? ""
                                                : "border-border hover:border-gray-300 dark:hover:border-gray-700"}
                                        `}
                                        style={isSelected ? { borderColor: "var(--accent-primary)", backgroundColor: "var(--accent-secondary)" } : undefined}
                                    >
                                        <Icon size={20} className={isSelected ? t.color : "text-gray-400"} />
                                        <span className={`text-[10px] font-bold mt-1 ${isSelected ? "" : "text-gray-500"}`} style={isSelected ? { color: "var(--accent-primary)" } : undefined}>
                                            {t.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground block">
                                {t("contentLabel")} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={t("placeholder")}
                                className="w-full h-40 p-4 bg-background border border-border rounded-xl resize-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all outline-none text-sm text-foreground"
                            />
                        </div>

                        {/* Footer */}
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                {t("cancel")}
                            </button>
                            <button
                                type="submit"
                                disabled={!content.trim() || isSubmitting}
                                className={`
                                    flex-[2] px-4 py-3 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-2
                                    ${(!content.trim() || isSubmitting) ? "opacity-50 cursor-not-allowed" : "hover:brightness-90 shadow-lg"}
                                `}
                                style={{ backgroundColor: "var(--accent-primary)" }}
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send size={18} />
                                        <span>{t("submit")}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
