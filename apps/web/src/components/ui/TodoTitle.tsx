import React from "react";

/**
 * Todoのタイトルを表示するコンポーネント。
 * "(N回目)" のようなサフィックスを検出して薄いグレーで表示します。
 */
export const TodoTitle = ({ title, className = "" }: { title: string, className?: string }) => {
    // Match " (N回目)" at the end
    const match = title.match(/^(.*)(\(\d+回目\))$/);

    if (match) {
        const main = match[1];
        const suffix = match[2];
        return (
            <span className={className}>
                {main}
                <span className="text-gray-400 font-normal ml-1">{suffix}</span>
            </span>
        );
    }

    return <span className={className}>{title}</span>;
}
