"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Download, Twitter, Facebook, Instagram, Hash } from "lucide-react";
import { Session, Todo, Category } from "@studytodo/shared";
import { ShareCard } from "./ShareCard";
import { generateAndCopyImage, downloadImage } from "@/lib/share-image";
import { calculateStreak } from "@/lib/statistics";
import { useTranslations } from "next-intl";

interface ShareTabProps {
    sessions: Session[];
    todos: Todo[];
    flatCategories: Category[];
}

export function ShareTab({ sessions, todos, flatCategories }: ShareTabProps) {
    const [targetShareCategory, setTargetShareCategory] = useState<string>("all");
    const [isSharing, setIsSharing] = useState(false);
    const shareCardRef = React.useRef<HTMLDivElement>(null);

    const t = useTranslations("activity");

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
                        <head><title>StudyTodo Share</title></head>
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
                await downloadImage(shareCardRef.current, `studytodo-stats-${format(new Date(), 'yyyyMMdd')}.png`);
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
                const text = `I've focused for ${Math.floor(cardDuration / 60)} mins on StudyTodo! streak: ${streak.currentStreak} days. #StudyTodo #Pomodoro`;
                const encodedText = encodeURIComponent(text);

                switch (platform) {
                    case 'x':
                        url = `https://twitter.com/intent/tweet?text=${encodedText}`;
                        break;
                    case 'facebook':
                        url = `https://www.facebook.com/sharer/sharer.php?u=https://studytodo.app`; // FB only allows URL share
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

    return (
        // --- Share Tab ---
        <div className="flex flex-col lg:flex-row gap-8 h-full">
            {/* Left: Preview */}
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl p-4 overflow-hidden min-h-[400px]">
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
                        userName="StudyTodo Member"
                    />
                </div>
            </div>

            {/* Right: Controls */}
            <div className="w-full lg:w-80 flex flex-col space-y-6 flex-shrink-0">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t("selectCategory")}</label>
                    <select
                        value={targetShareCategory}
                        onChange={(e) => setTargetShareCategory(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3"
                    >
                        <option value="all">{t("allActivities")}</option>
                        {flatCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t("shareSocial")}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("shareSocialDesc")}</p>

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
    );
}
