import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db";
import { mapper } from "@/lib/mapper";

/**
 * useSync Hook
 * 認証状態を監視し、ログイン時(およびアプリ起動時)にクラウドから最新データを取得して
 * ローカルDB(Dexie)にマージします。
 */
export function useSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
                await pullFromCloud(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const pullFromCloud = async (userId: string) => {
        setIsSyncing(true);
        console.log("Starting Cloud Pull...");

        try {
            // 1. Fetch from Supabase
            // TODO: Parallel fetch
            const { data: todos, error: todoError } = await supabase.from('todos').select('*');
            const { data: sessions, error: sessionError } = await supabase.from('sessions').select('*');
            const { data: categories, error: catError } = await supabase.from('categories').select('*');
            const { data: srs, error: srsError } = await supabase.from('srs_profiles').select('*');

            if (todoError) throw todoError;
            if (sessionError) throw sessionError;
            if (catError) throw catError;
            if (srsError) throw srsError;

            // 2. Map snake_case -> camelCase
            const localTodos = todos.map(mapper.fromSupabase);
            const localSessions = sessions.map(mapper.fromSupabase);
            const localCategories = categories.map(mapper.fromSupabase);
            const localSrs = srs.map(mapper.fromSupabase);

            // 3. Merge into Dexie (bulkPut upserts by ID)
            await db.transaction('rw', db.todos, db.sessions, db.categories, db.srsProfiles, async () => {
                if (localCategories.length) await db.categories.bulkPut(localCategories);
                if (localSrs.length) await db.srsProfiles.bulkPut(localSrs);
                if (localTodos.length) await db.todos.bulkPut(localTodos);
                if (localSessions.length) await db.sessions.bulkPut(localSessions);
            });

            console.log("Cloud Pull Complete.");
            setLastSyncTime(new Date());

        } catch (error) {
            console.error("Sync Error:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    return { isSyncing, lastSyncTime, pullFromCloud };
}
