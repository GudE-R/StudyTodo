import React from "react";

interface AppShellProps {
    children: React.ReactNode;
}

/**
 * アプリケーション全体のレイアウトシェル
 * 
 * モバイルファーストのレイアウトを提供し、上部の広告バナー領域と
 * メインコンテンツ領域を定義します。
 */
export function AppShell({ children }: AppShellProps) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* 
        上部バナー広告プレースホルダー 
        要件定義に基づき、画面最上部に固定表示されます。
      */}
            <div className="h-[50px] bg-gray-200 w-full flex items-center justify-center text-xs text-gray-500 border-b border-gray-300 sticky top-0 z-50">
                [Ad Banner Area]
            </div>

            {/* 
        メインコンテンツラッパー
        PC向けフルスクリーンレイアウト。
        下部のボトムアクションバーのためにpb-20を設定しています。
      */}
            <main className="w-full mx-auto bg-white dark:bg-gray-900 min-h-[calc(100vh-50px)] shadow-sm relative pb-20">
                {children}
            </main>
        </div>
    );
}
