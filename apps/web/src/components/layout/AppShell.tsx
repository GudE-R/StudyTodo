import React from "react";

interface AppShellProps {
    children: React.ReactNode;
}

/**
 * 繧｢繝励Μ繧ｱ繝ｼ繧ｷ繝ｧ繝ｳ蜈ｨ菴薙・繝ｬ繧､繧｢繧ｦ繝医す繧ｧ繝ｫ
 * 
 * 繝｢繝舌う繝ｫ繝輔ぃ繝ｼ繧ｹ繝医・繝ｬ繧､繧｢繧ｦ繝医ｒ謠蝉ｾ帙＠縲∽ｸ企Κ縺ｮ蠎・相繝舌リ繝ｼ鬆伜沺縺ｨ
 * 繝｡繧､繝ｳ繧ｳ繝ｳ繝・Φ繝・伜沺繧貞ｮ夂ｾｩ縺励∪縺吶・
 */
export function AppShell({ children }: AppShellProps) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* 
        荳企Κ繝舌リ繝ｼ蠎・相繝励Ξ繝ｼ繧ｹ繝帙Ν繝繝ｼ 
        隕∽ｻｶ螳夂ｾｩ縺ｫ蝓ｺ縺･縺阪∫判髱｢譛荳企Κ縺ｫ蝗ｺ螳夊｡ｨ遉ｺ縺輔ｌ縺ｾ縺吶・
      */}
            <div className="h-[50px] bg-gray-200 w-full flex items-center justify-center text-xs text-gray-500 border-b border-gray-300 sticky top-0 z-50">
                [Ad Banner Area]
            </div>

            {/* 
        繝｡繧､繝ｳ繧ｳ繝ｳ繝・Φ繝・Λ繝・ヱ繝ｼ
        PC蜷代￠繝輔Ν繧ｹ繧ｯ繝ｪ繝ｼ繝ｳ繝ｬ繧､繧｢繧ｦ繝医・
        荳矩Κ縺ｮ繝懊ヨ繝繧｢繧ｯ繧ｷ繝ｧ繝ｳ繝舌・縺ｮ縺溘ａ縺ｫpb-20繧定ｨｭ螳壹＠縺ｦ縺・∪縺吶・
      */}
            <main className="w-full mx-auto bg-white dark:bg-gray-900 min-h-[calc(100vh-50px)] shadow-sm relative pb-20">
                {children}
            </main>
        </div>
    );
}
