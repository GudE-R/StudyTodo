import { AdBanner } from "../ads/AdBanner";

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
        <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
            {/* 
        上部バナー広告
        要件定義に基づき、画面最上部に固定表示されます。
      */}
            <div className="h-[50px] w-full border-b border-border sticky top-0 z-50 transition-colors duration-300">
                <AdBanner format="auto" />
            </div>

            {/* 
        メインコンテンツラッパー
        PC向けフルスクリーンレイアウト。
        下部のボトムアクションバーのためにpb-20を設定しています。
      */}
            <main className="w-full mx-auto bg-card min-h-[calc(100vh-50px)] shadow-sm relative pb-20 transition-colors duration-300">
                {children}
            </main>
        </div>
    );
}
