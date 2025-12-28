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

    const sync = async (userId: string) => {
        if (isSyncing) return;
        setIsSyncing(true);
        console.log("Starting Sync...");

        try {
            // 1. Fetch all data from both sources
            // Supabase
            const { data: cloudTodos, error: todoError } = await supabase.from('todos').select('*');
            const { data: cloudSessions, error: sessionError } = await supabase.from('sessions').select('*');
            const { data: cloudCategories, error: catError } = await supabase.from('categories').select('*');
            const { data: cloudSrs, error: srsError } = await supabase.from('srs_profiles').select('*');

            if (todoError) throw todoError;
            if (sessionError) throw sessionError;
            if (catError) throw catError;
            if (srsError) throw srsError;

            // Dexie
            const localTodos = await db.todos.toArray();
            const localSessions = await db.sessions.toArray();
            const localCategories = await db.categories.toArray();
            const localSrs = await db.srsProfiles.toArray();

            // 2. Merge Logic (Last Write Wins)
            const processTable = async (
                localItems: any[],
                cloudItems: any[],
                tableName: 'categories' | 'todos' | 'sessions' | 'srs_profiles' | 'srsProfiles', // Dexie table name
                supabaseTableName: string
            ) => {
                const cloudMap = new Map(cloudItems.map(i => [i.id, mapper.fromSupabase(i)]));
                const localMap = new Map(localItems.map(i => [i.id, i]));

                const toImport: any[] = [];
                const toExport: any[] = [];

                // Check Cloud items against Local
                for (const [id, cloudItem] of cloudMap) {
                    const localItem = localMap.get(id);
                    if (!localItem) {
                        // Cloud has it, Local doesn't -> Import
                        toImport.push(cloudItem);
                    } else {
                        // Both have it -> Compare updatedAt
                        const cloudTime = new Date(cloudItem.updatedAt || 0).getTime();
                        const localTime = new Date(localItem.updatedAt || 0).getTime();

                        if (cloudTime > localTime) {
                            toImport.push(cloudItem);
                        } else if (localTime > cloudTime) {
                            toExport.push(localItem);
                        }
                    }
                }

                // Check Local items strictly for missing in Cloud (New items)
                for (const [id, localItem] of localMap) {
                    if (!cloudMap.has(id)) {
                        toExport.push(localItem);
                    }
                }

                // 3. Apply changes

                // Import to Dexie
                if (toImport.length > 0) {
                    // @ts-ignore
                    await db[tableName].bulkPut(toImport);
                }

                // Export to Supabase
                if (toExport.length > 0) {
                    const mappedExports = toExport.map(item => mapper.toSupabase(item, userId));
                    const { error } = await supabase.from(supabaseTableName).upsert(mappedExports);
                    if (error) throw error;
                }

                return { imported: toImport.length, exported: toExport.length };
            };

            await processTable(localCategories, cloudCategories, 'categories', 'categories');
            await processTable(localSrs, cloudSrs, 'srsProfiles', 'srs_profiles'); // Note: Dexie table is srsProfiles
            await processTable(localTodos, cloudTodos, 'todos', 'todos');
            await processTable(localSessions, cloudSessions, 'sessions', 'sessions');

            console.log("Sync Complete.");
            setLastSyncTime(new Date());

        } catch (error) {
            console.error("Sync Error:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    // Auto-pull on login is now actually a full sync to ensure consistency?
    // Or just pull? Full sync is safer but maybe heavier. 
    // Let's do full sync to ensure "Login on new device -> Get data" AND "Login on old device -> Push pending"
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
                await sync(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return { isSyncing, lastSyncTime, sync };
}
