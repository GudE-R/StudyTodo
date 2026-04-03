"use client";

import React, { useEffect, useRef } from "react";

declare global {
    interface Window {
        adsbygoogle: Record<string, unknown>[];
    }
}

// 広告を一時的に無効化（復活時はこのフラグをtrueに戻す）
const ADS_ENABLED = false;

interface AdBannerProps {
    slot?: string;
    style?: React.CSSProperties;
    format?: "auto" | "fluid" | "rectangle";
    responsive?: "true" | "false";
}

/**
 * 広告バナーコンポーネント (Google AdSense 互換)
 *
 * 環境変数 NEXT_PUBLIC_ADSENSE_CLIENT_ID が設定されている場合に
 * 実際の広告タグを注入します。設定されていない場合は、開発用プレースホルダーを表示します。
 */
export function AdBanner({ slot, style, format = "auto", responsive = "true" }: AdBannerProps) {
    if (!ADS_ENABLED) return null;

    const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
    const adRef = useRef<HTMLModElement>(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!clientId || initializedRef.current) return;

        // すでにAdSenseによって処理されているかチェック
        if (adRef.current?.getAttribute("data-adsbygoogle-status") === "done") {
            initializedRef.current = true;
            return;
        }

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            initializedRef.current = true;
        } catch (err) {
            // "All 'ins' elements... already have ads" エラーは無視して動作を継続させる
            const error = err as Error;
            if (!error.message?.includes("already have ads")) {
                console.error("AdSense error:", err);
            }
        }
    }, [clientId]);

    if (!clientId) {
        // 開発用プレースホルダー
        return (
            <div
                className="w-full h-full bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-[10px] text-gray-400 border border-dashed border-gray-300 dark:border-gray-700"
                style={style}
            >
                <span className="font-bold">ADVERTISEMENT</span>
                <span className="mt-0.5">Placeholder Box</span>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden" style={style}>
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{ display: "block", ...style }}
                data-ad-client={clientId}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive}
            />
        </div>
    );
}
