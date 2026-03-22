"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { X, Palette, Database, Download, Crown, BookOpen, Check } from "lucide-react";
import { ThemeEditor } from "../template/ThemeEditor";
import { exportToJson, exportSessionsToCsv } from "@/lib/export";
import { useJournalSettings } from "@/hooks/useJournal";
import { useTheme } from "@/contexts/ThemeContext";
import { ACCENT_PRESETS, AccentColor } from "@studytodo/shared";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const t = useTranslations("settings");
    const { settings: journalSettings, updateSettings: updateJournalSettings } = useJournalSettings();
    const { accentColor, setAccentColor, resolvedTheme } = useTheme();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl h-auto max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t("title")}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* テーマ設定セクション */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 font-bold border-b border-gray-100 dark:border-gray-800 pb-2">
                            <Palette size={20} style={{ color: "var(--accent-primary)" }} />
                            <h3>{t("appearance")}</h3>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                            <ThemeEditor />
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                                {t("accentColor", { defaultValue: "Accent Color" })}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {(Object.keys(ACCENT_PRESETS) as AccentColor[]).map((color) => {
                                    const preset = ACCENT_PRESETS[color];
                                    const displayColor = resolvedTheme === "dark" ? preset.dark.primary : preset.light.primary;
                                    const selected = accentColor === color;
                                    return (
                                        <button
                                            key={color}
                                            onClick={() => setAccentColor(color)}
                                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                                selected ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110" : "hover:scale-110"
                                            }`}
                                            style={{ backgroundColor: displayColor }}
                                            title={t(`accent${color.charAt(0).toUpperCase() + color.slice(1)}` as Parameters<typeof t>[0], { defaultValue: color })}
                                        >
                                            {selected && <Check size={16} className="text-white" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Journal設定セクション */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 font-bold border-b border-gray-100 dark:border-gray-800 pb-2">
                            <BookOpen size={20} style={{ color: "var(--accent-primary)" }} />
                            <h3>{t("journal", { defaultValue: "Journal" })}</h3>
                        </div>
                        <div className="space-y-2">
                            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl cursor-pointer">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                    {t("journalEnabled", { defaultValue: "Journal Feature" })}
                                </span>
                                <input
                                    type="checkbox"
                                    checked={journalSettings.enabled}
                                    onChange={(e) => updateJournalSettings({ enabled: e.target.checked })}
                                    className="w-5 h-5 rounded" style={{ accentColor: "var(--accent-primary)" }}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Proプラン案内 */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 font-bold border-b border-gray-100 dark:border-gray-800 pb-2">
                            <Crown size={20} className="text-amber-500" />
                            <h3>{t("cloudSync")}</h3>
                        </div>
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                            <div className="text-sm font-bold text-amber-700 dark:text-amber-300 mb-1">
                                {t("proComingSoon")}
                            </div>
                            <div className="text-xs text-amber-600 dark:text-amber-400">
                                {t("proDescription")}
                            </div>
                        </div>
                    </div>

                    {/* データ管理セクション */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 font-bold border-b border-gray-100 dark:border-gray-800 pb-2">
                            <Database size={20} className="text-purple-500" />
                            <h3>{t("dataManagement")}</h3>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={async () => {
                                    if (confirm(t("backupConfirm"))) {
                                        await exportToJson();
                                    }
                                }}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors group"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("backupJson")}</span>
                                    <span className="text-xs text-gray-400">{t("backupJsonDescription")}</span>
                                </div>
                                <Download size={18} className="text-gray-400 group-hover:text-purple-500 transition-colors" />
                            </button>

                            <button
                                onClick={async () => {
                                    if (confirm(t("exportConfirm"))) {
                                        await exportSessionsToCsv();
                                    }
                                }}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors group"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("exportCsv")}</span>
                                    <span className="text-xs text-gray-400">{t("exportCsvDescription")}</span>
                                </div>
                                <Download size={18} className="text-gray-400 group-hover:text-green-500 transition-colors" />
                            </button>
                        </div>
                    </div>

                    {/* Version Info */}
                    <div className="text-center text-xs text-gray-400 pt-4">
                        StudyTodo v1.1.0
                    </div>
                </div>
            </div>
        </div>
    );
}
