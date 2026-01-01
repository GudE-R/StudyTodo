"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { X, Palette, Database, Download, Cloud, LogOut } from "lucide-react";
import { ThemeEditor } from "../template/ThemeEditor";
import { exportToJson, exportSessionsToCsv } from "@/lib/export";
import { useSync } from "@/hooks/useSync";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenAuth: () => void;
}

/**
 * 設定モーダル
 * 
 * テーマ設定と使用ガイドへのアクセスを提供します。
 */
export function SettingsModal({ isOpen, onClose, onOpenAuth }: SettingsModalProps) {
    const { user, signOut } = useAuth();
    const { lastSyncTime } = useSync(); // Removed sync and isSyncing as they are no longer used for a "Sync Now" button
    const [userEmail, setUserEmail] = useState<string | null>(null);

    const t = useTranslations("settings");
    const tc = useTranslations("common");

    useEffect(() => {
        setUserEmail(user?.email ?? null);
    }, [user]);

    const handleLogout = async () => {
        await signOut();
        setUserEmail(null);
        alert(t("logoutConfirm"));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl h-auto max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">

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
                            <Palette size={20} className="text-blue-500" />
                            <h3>{t("appearance")}</h3>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                            <ThemeEditor />
                        </div>
                    </div>


                    {/* クラウド同期セクション */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 font-bold border-b border-gray-100 dark:border-gray-800 pb-2">
                            <Cloud size={20} className="text-blue-500" />
                            <h3>{t("cloudSync")}</h3>
                        </div>

                        {userEmail ? (
                            // Logged In State
                            <div className="space-y-2">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <div className="text-xs text-blue-600 dark:text-blue-300 font-bold uppercase mb-1">
                                        {t("loggedInAs")}
                                    </div>
                                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                        {userEmail}
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors group"
                                >
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400">
                                        {t("logout")}
                                    </span>
                                    <LogOut size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                                </button>
                            </div>
                        ) : (
                            // Logged Out State
                            <button
                                onClick={() => {
                                    onClose();
                                    onOpenAuth();
                                }}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors group"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("loginToBackup")}</span>
                                    <span className="text-xs text-gray-400">{t("backupCloudDescription")}</span>
                                </div>
                                <Cloud size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </button>
                        )}

                        {userEmail && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {t("cloudSync")}
                                        </span>
                                        <span className="text-xs text-green-500 dark:text-green-400 flex items-center mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></div>
                                            有効 (リアルタイム)
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-gray-400 bg-white dark:bg-gray-900 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-800">
                                        {lastSyncTime
                                            ? `${t("lastSynced")}: ${lastSyncTime.toLocaleTimeString()}`
                                            : t("justSynced")}
                                    </div>
                                </div>
                            </div>
                        )}
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

                    {/* Version Info (Optional) */}
                    <div className="text-center text-xs text-gray-400 pt-4">
                        PomArc v1.0.0
                    </div>
                </div>
            </div>
        </div>
    );
}
