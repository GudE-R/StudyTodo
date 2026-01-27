import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { mapper } from "@studytodo/shared";

/**
 * Migration Utility
 * ローカル(Dexie)のデータをSupabaseへアップロードします。
 * 
 * 戦略:
 * 1. ユーザー認証チェック
 * 2. Dexieから全データ取得
 * 3. SupabaseへテーブルごとにBulk Insert (upsert)
 */
export async function migrateLocalToCloud() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("ログインしてください。");
    }

    const categories = await db.categories.toArray();
    const srsProfiles = await db.srsProfiles.toArray();
    const todos = await db.todos.toArray();
    const sessions = await db.sessions.toArray();

    // Map to Supabase format with user_id
    const formatForCloud = (items: any[]) => items.map(item => mapper.toSupabase(item, user.id));

    // Categories
    if (categories.length > 0) {
        const { error } = await supabase
            .from('categories')
            .upsert(formatForCloud(categories), { onConflict: 'id' });
        if (error) throw new Error(`Categories Sync Error: ${error.message}`);
    }

    // SRS Profiles
    if (srsProfiles.length > 0) {
        const { error } = await supabase
            .from('srs_profiles')
            .upsert(formatForCloud(srsProfiles), { onConflict: 'id' });
        if (error) throw new Error(`SRS Profiles Sync Error: ${error.message}`);
    }

    // Todos
    if (todos.length > 0) {
        const { error } = await supabase
            .from('todos')
            .upsert(formatForCloud(todos), { onConflict: 'id' });
        if (error) throw new Error(`Todos Sync Error: ${error.message}`);
    }

    // Sessions
    if (sessions.length > 0) {
        // Chunking for sessions if too many
        const chunk = (arr: any[], size: number) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
            arr.slice(i * size, i * size + size)
        );
        const sessionChunks = chunk(formatForCloud(sessions), 100);

        for (const sChunk of sessionChunks) {
            const { error } = await supabase
                .from('sessions')
                .upsert(sChunk, { onConflict: 'id' });
            if (error) throw new Error(`Sessions Sync Error: ${error.message}`);
        }
    }

    return {
        categories: categories.length,
        todos: todos.length,
        sessions: sessions.length
    };
}
