import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { mapper, allowedFieldsMap, Session, processTableSync, SyncItem } from "@studytodo/shared";
import { useRepository } from "../providers/RepositoryProvider";

import { useMobileRealtimeSync } from "./useMobileRealtimeSync";

export function useMobileSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [userId, setUserId] = useState<string | undefined>();
    const repo = useRepository();

    const sync = async (uId: string) => {
        if (isSyncing) return;
        setIsSyncing(true);
        if (__DEV__) console.log("Starting Mobile Full Sync...");

        try {
            const { data: cloudTodos, error: todoError } = await supabase.from('todos').select('*');
            const { data: cloudSessions, error: sessionError } = await supabase.from('sessions').select('*');
            const { data: cloudCategories, error: catError } = await supabase.from('categories').select('*');
            const { data: cloudSrs, error: srsError } = await supabase.from('srs_profiles').select('*');

            if (todoError) throw todoError;
            if (sessionError) throw sessionError;
            if (catError) throw catError;
            if (srsError) throw srsError;

            const localTodos = await repo.getTodos();
            const localSessions = await repo.getSessions();
            let localCategories = await repo.getCategories();
            let localSrs = await repo.getSRSProfiles();

            // クラウドにデータがある場合、ローカルのサンプルデータ（名前でマッチ）を削除して重複を防ぐ
            if (cloudCategories && cloudCategories.length > 0) {
                const sampleCategoryNames = ['大カテゴリサンプル', '中カテゴリサンプル', '小カテゴリサンプル'];
                const sampleCategoryIds = localCategories
                    .filter(c => sampleCategoryNames.includes(c.name))
                    .map(c => c.id);
                for (const id of sampleCategoryIds) {
                    await repo.deleteCategory(id);
                }
            }

            if (cloudSrs && cloudSrs.length > 0) {
                const defaultSrsIds = localSrs
                    .filter(s => s.name === '忘却曲線 (標準)' && !cloudSrs.some(cs => cs.id === s.id))
                    .map(s => s.id);
                for (const id of defaultSrsIds) {
                    await repo.deleteSRSProfile(id);
                }
            }

            // 削除後の最新データを取得
            localCategories = await repo.getCategories();
            localSrs = await repo.getSRSProfiles();

            // 共通 processTableSync を使用したヘルパー
            const syncTable = async (
                localItems: any[],
                cloudRawItems: any[],
                repoMethods: {
                    add: (item: any) => Promise<void>,
                    update: (id: string, updates: any) => Promise<void>
                },
                supabaseTableName: string
            ) => {
                // クラウドデータを fromSupabase で変換
                const cloudItems = cloudRawItems.map(i => mapper.fromSupabase(i)) as SyncItem[];

                await processTableSync(localItems as SyncItem[], cloudItems, {
                    onImport: async (item) => { await repoMethods.add(item); },
                    onUpdate: async (id, item) => { await repoMethods.update(id, item as any); },
                    onExport: async (items) => {
                        const fields = allowedFieldsMap[supabaseTableName];
                        const mapped = items.map(item => mapper.toSupabase(item as unknown as Record<string, unknown>, uId, fields));
                        const { error } = await supabase.from(supabaseTableName).upsert(mapped);
                        if (error) throw error;
                    }
                });
            };

            await syncTable(localCategories, cloudCategories, { add: (i) => repo.addCategory(i), update: (id, u) => repo.updateCategory(id, u) }, 'categories');
            await syncTable(localSrs, cloudSrs, { add: (i) => repo.addSRSProfile(i), update: (id, u) => repo.updateSRSProfile(id, u) }, 'srs_profiles');
            await syncTable(localTodos, cloudTodos, { add: (i) => repo.addTodo(i), update: (id, u) => repo.updateTodo(id, u) }, 'todos');

            // Sessions は updatedAt がないため専用ロジック
            const sessionCloudMap = new Map(cloudSessions.map(i => [i.id, mapper.fromSupabase(i)]));
            const sessionLocalMap = new Map(localSessions.map(i => [i.id, i]));
            for (const [id, rawCloudItem] of sessionCloudMap) {
                if (!sessionLocalMap.has(id)) await repo.addSession(rawCloudItem as unknown as Session);
            }
            const sessionsToExport = localSessions.filter(s => !sessionCloudMap.has(s.id));
            if (sessionsToExport.length > 0) {
                const fields = allowedFieldsMap['sessions'];
                const mappedExports = sessionsToExport.map(item => mapper.toSupabase(item as unknown as Record<string, unknown>, uId, fields));
                await supabase.from('sessions').upsert(mappedExports);
            }

            if (__DEV__) console.log("Mobile Full Sync Complete.");
            setLastSyncTime(new Date());

        } catch (error) {
            console.error("Sync Error:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    // Activate Realtime Subscription
    useMobileRealtimeSync(userId);

    // Auto-sync on Auth State Change
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
                setUserId(session.user.id);
                await sync(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                setUserId(undefined);
                if (repo.clearAll) {
                    await repo.clearAll();
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);


    return { isSyncing, lastSyncTime, sync };
}
