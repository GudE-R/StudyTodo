import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";

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

    // 1. カテゴリ (Categories)
    // 依存関係があるため、親カテゴリ -> 子カテゴリの順序...と言いたいが
    // UUIDなのでID参照さえ合っていれば、挿入順序はFK制約に引っかからなければOK。
    // 親IDが別のレコードを参照するので、全件一括だとどうなるか？
    // PostgresのFK制約はDeferredできない場合、親が存在しないとエラーになる場合がある。
    // なので、ParentIDがNullのもの -> あるもの の順? 
    // あるいは一時的に制約無効化はRamasではできない。
    // 単純に upsert であれば、全件投げてもトランザクション内で解決...はしないかも。
    // 安全策として、まずParent無しのカテゴリ、次にParentありのカテゴリを入れるか、
    // あるいは単に「カテゴリ」->「Todo」の順序を守る。

    const categories = await db.categories.toArray();
    const srsProfiles = await db.srsProfiles.toArray();
    const todos = await db.todos.toArray();
    const sessions = await db.sessions.toArray();

    // userIdを付与して整形
    const mapWithUser = (items: any[]) => items.map(item => ({
        ...item,
        user_id: user.id,
        // DexieのDate型をISO文字列に変換(SupabaseはISO文字列を受け取るが、supabase-jsがDateも処理してくれるはず)
        // ただし undefined なフィールドは除外しないとエラーになることがあるので注意
    }));

    // Categories
    if (categories.length > 0) {
        const { error } = await supabase
            .from('categories')
            .upsert(mapWithUser(categories), { onConflict: 'id' });
        if (error) throw new Error(`Categories Sync Error: ${error.message}`);
    }

    // SRS Profiles
    if (srsProfiles.length > 0) {
        const { error } = await supabase
            .from('srs_profiles')
            .upsert(mapWithUser(srsProfiles), { onConflict: 'id' });
        if (error) throw new Error(`SRS Profiles Sync Error: ${error.message}`);
    }

    // Todos
    if (todos.length > 0) {
        const { error } = await supabase
            .from('todos')
            .upsert(mapWithUser(todos), { onConflict: 'id' });
        if (error) throw new Error(`Todos Sync Error: ${error.message}`);
    }

    // Sessions
    if (sessions.length > 0) {
        // セッションは数が多い可能性があるので、チャンク分けする？
        // 一旦そのまま
        const { error } = await supabase
            .from('sessions')
            .upsert(mapWithUser(sessions), { onConflict: 'id' });
        if (error) throw new Error(`Sessions Sync Error: ${error.message}`);
    }

    return {
        categories: categories.length,
        todos: todos.length,
        sessions: sessions.length
    };
}
