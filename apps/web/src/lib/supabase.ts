import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 迺ｰ蠅・､画焚縺後Ο繝ｼ繝峨＆繧後※縺・↑縺・ｴ蜷医・繧ｨ繝ｩ繝ｼ繝上Φ繝峨Μ繝ｳ繧ｰ
if (!supabaseUrl || !supabaseAnonKey) {
    console.error(`
        [Supabase Error] Environment variables missing.
        NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "Loaded" : "Missing"}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "Loaded" : "Missing"}
        Please check d:/PomArc/.env.local content format.
    `);
}

// 繧ｯ繝ｩ繧､繧｢繝ｳ繝井ｽ懈・・・RL縺後↑縺・ｴ蜷医・遨ｺ譁・ｭ励ｒ貂｡縺吶′縲√％繧後ｒ菴ｿ逕ｨ縺吶ｋ縺ｨ繧ｨ繝ｩ繝ｼ縺ｫ縺ｪ繧九◆繧√∽ｽｿ逕ｨ蛛ｴ縺ｧ繝√ぉ繝・け縺悟ｿ・ｦ・ｼ・
export const supabase = createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder-key"
);
