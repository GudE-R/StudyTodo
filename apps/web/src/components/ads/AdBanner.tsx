"use client";

import React, { useEffect } from "react";

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
    const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

    useEffect(() => {
        if (!clientId) return;

        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error("AdSense error:", err);
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
