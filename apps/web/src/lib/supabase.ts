import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 環境変数がロードされていない場合のエラーハンドリング
if (!supabaseUrl || !supabaseAnonKey) {
    console.error(`
        [Supabase Error] Environment variables missing.
        NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "Loaded" : "Missing"}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "Loaded" : "Missing"}
        Please check .env.local content format.
    `);
}

// クライアント作成（URLがない場合は空文字を渡すが、これを使用するとエラーになるため、使用側でチェックが必要）
export const supabase = createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder-key"
);
