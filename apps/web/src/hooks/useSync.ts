import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db";
import { mapper, allowedFieldsMap, processTableSync, SyncItem } from "@studytodo/shared";
import { useRealtimeSync } from "./useRealtimeSync";
import { initNetworkListener, processOfflineQueue } from "@/lib/offlineQueue";
import type { Table } from "dexie";

/**
 * useSync Hook
 * 認証状態を監視し、ログイン時(およびアプリ起動時)にクラウドから最新データを取得して
 * ローカルDB(Dexie)にマージします。
 * また、リアルタイム同期リスナーを有効にします。
 */
export function useSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [userId, setUserId] = useState<string | undefined>();

    const sync = async (uId: string) => {
        if (isSyncing) return;
        setIsSyncing(true);

        // Set userId for DB hooks
        db.setUserId(uId);

        try {
            const { data: cloudTodos, error: todoError } = await supabase.from('todos').select('*');
            const { data: cloudSessions, error: sessionError } = await supabase.from('sessions').select('*');
            const { data: cloudCategories, error: catError } = await supabase.from('categories').select('*');
            const { data: cloudSrs, error: srsError } = await supabase.from('srs_profiles').select('*');

            if (todoError) throw todoError;
            if (sessionError) throw sessionError;
            if (catError) throw catError;
            if (srsError) throw srsError;

            const localTodos = await db.todos.toArray();
            const localSessions = await db.sessions.toArray();
            const localCategories = await db.categories.toArray();
            const localSrs = await db.srsProfiles.toArray();

            // クラウドにデータがある場合、ローカルのサンプルデータ（名前でマッチ）を削除して重複を防ぐ
            if (cloudCategories && cloudCategories.length > 0) {
                const sampleCategoryNames = ['大カテゴリサンプル', '中カテゴリサンプル', '小カテゴリサンプル'];
                const sampleCategoryIds = localCategories
                    .filter(c => sampleCategoryNames.includes(c.name))
                    .map(c => c.id);
                if (sampleCategoryIds.length > 0) {
                    await db.transaction('rw', db.categories, (trans) => {
                        (trans as unknown as { source: string }).source = 'sync';
                        return db.categories.bulkDelete(sampleCategoryIds);
                    });
                }
            }

            if (cloudSrs && cloudSrs.length > 0) {
                const defaultSrsIds = localSrs
                    .filter(s => s.name === '忘却曲線 (標準)' && !cloudSrs.some(cs => cs.id === s.id))
                    .map(s => s.id);
                if (defaultSrsIds.length > 0) {
                    await db.transaction('rw', db.srsProfiles, (trans) => {
                        (trans as unknown as { source: string }).source = 'sync';
                        return db.srsProfiles.bulkDelete(defaultSrsIds);
                    });
                }
            }

            // 削除後の最新データを取得
            const filteredLocalCategories = await db.categories.toArray();
            const filteredLocalSrs = await db.srsProfiles.toArray();

            // 共通 processTableSync を使用したヘルパー
            const syncTable = async (
                localItems: any[],
                cloudRawItems: any[],
                tableName: 'categories' | 'todos' | 'sessions' | 'srsProfiles',
                supabaseTableName: string
            ) => {
                // クラウドデータを fromSupabase で変換
                const cloudItems = cloudRawItems.map(i => mapper.fromSupabase(i)) as SyncItem[];

                await processTableSync(localItems as SyncItem[], cloudItems, {
                    onImport: async (item) => {
                        await db.transaction('rw', db[tableName], (trans) => {
                            (trans as unknown as { source: string }).source = 'sync';
                            return (db[tableName] as Table).put(item);
                        });
                    },
                    onUpdate: async (_id, item) => {
                        await db.transaction('rw', db[tableName], (trans) => {
                            (trans as unknown as { source: string }).source = 'sync';
                            return (db[tableName] as Table).put(item);
                        });
                    },
                    onExport: async (items) => {
                        const fields = allowedFieldsMap[supabaseTableName];
                        const mapped = items.map(item => mapper.toSupabase(item as unknown as Record<string, unknown>, uId, fields));
                        const { error } = await supabase.from(supabaseTableName).upsert(mapped);
                        if (error) throw error;
                    }
                });
            };

            await syncTable(filteredLocalCategories, cloudCategories, 'categories', 'categories');
            await syncTable(filteredLocalSrs, cloudSrs, 'srsProfiles', 'srs_profiles');
            await syncTable(localTodos, cloudTodos, 'todos', 'todos');
            await syncTable(localSessions, cloudSessions, 'sessions', 'sessions');

            setLastSyncTime(new Date());

        } catch (error) {
            const e = error as { message?: string; code?: string; details?: string; hint?: string };
            console.error("Sync Error:", {
                message: e.message || "Unknown error",
                code: e.code,
                details: e.details,
                hint: e.hint
            });
        } finally {
            setIsSyncing(false);
        }
    };

    // Activate Realtime Subscription
    useRealtimeSync(userId);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
                setUserId(session.user.id);
                db.setUserId(session.user.id);
                await sync(session.user.id);

                // Process any pending offline changes
                await processOfflineQueue(session.user.id, supabase, mapper);

                // Setup network listener for future reconnections
                initNetworkListener(async () => {
                    await processOfflineQueue(session.user.id, supabase, mapper);
                });
            } else if (event === 'SIGNED_OUT') {
                setUserId(undefined);
                db.setUserId(null);
            }
        });

        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { isSyncing, lastSyncTime, sync };
}
