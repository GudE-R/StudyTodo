"use client";

import React from "react";
import { X, Play, Calendar, Clock, Repeat, FolderTree, Palette, Timer, BookOpen } from "lucide-react";

interface UsageGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * 使用ガイドモーダルコンポーネント
 * 
 * PomArcの主要機能の使い方を説明します。
 */
export function UsageGuideModal({ isOpen, onClose }: UsageGuideModalProps) {
    if (!isOpen) return null;

    const guides = [
        {
            icon: Play,
            title: "タスクの作成と開始",
            description: "画面下部の「＋」ボタンからタスクを作成できます。「今すぐ開始」で即座にタイマーを開始、「記録」で過去の学習を記録できます。"
        },
        {
            icon: Timer,
            title: "タイマー機能",
            description: "ポモドーロ（25分集中→5分休憩）、カウントダウン、ストップウォッチの3つのモードを選択できます。タイマー完了後は自動的に記録されます。"
        },
        {
            icon: Calendar,
            title: "カレンダーとスケジュール",
            description: "カレンダーで日付をタップして切り替え。スケジュール上で時間を長押しすると、その時刻でタスク作成モーダルが開きます。"
        },
        {
            icon: Repeat,
            title: "SRS（間隔反復）",
            description: "設定画面でSRSプロファイルを作成。タスクに適用すると、効率的な復習スケジュールが自動で設定されます。"
        },
        {
            icon: FolderTree,
            title: "カテゴリ管理",
            description: "設定画面でカテゴリを作成・編集。大分類→中分類→小分類の3階層で整理できます。"
        },
        {
            icon: Palette,
            title: "テーマ設定",
            description: "設定画面（右上の歯車アイコン）から、ライト/ダーク/システムから選択できます。"
        },
        {
            icon: Clock,
            title: "学習履歴",
            description: "画面下部の「活動」ボタンで、これまでの学習記録を確認できます。日別・週別の統計も表示されます。"
        },
        {
            icon: BookOpen,
            title: "タスク詳細",
            description: "リストやスケジュール上のタスクをタップすると詳細画面が開きます。ここから「今すぐ開始」やタスクの削除ができます。"
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">使い方ガイド</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {guides.map((guide, index) => {
                        const Icon = guide.icon;
                        return (
                            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                        <Icon className="text-blue-600 dark:text-blue-400" size={20} />
                                    </div>
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{guide.title}</h3>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {guide.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
}
