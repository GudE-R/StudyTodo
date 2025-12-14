import React from "react";

/**
 * Todo縺ｮ繧ｿ繧､繝医Ν繧定｡ｨ遉ｺ縺吶ｋ繧ｳ繝ｳ繝昴・繝阪Φ繝医・
 * "(N蝗樒岼)" 縺ｮ繧医≧縺ｪ繧ｵ繝輔ぅ繝・け繧ｹ繧呈､懷・縺励※阮・＞繧ｰ繝ｬ繝ｼ縺ｧ陦ｨ遉ｺ縺励∪縺吶・
 */
export const TodoTitle = ({ title, className = "" }: { title: string, className?: string }) => {
    // Match " (N蝗樒岼)" at the end
    const match = title.match(/^(.*)(\(\d+蝗樒岼\))$/);

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
