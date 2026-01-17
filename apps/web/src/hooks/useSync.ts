import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db";
import { mapper, allowedFieldsMap, compareDates } from "@pomarc/shared";
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
            // ... (fetching cloud/local data)
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

            const processTable = async (
                localItems: any[],
                cloudItems: any[],
                tableName: 'categories' | 'todos' | 'sessions' | 'srsProfiles',
                supabaseTableName: string
            ) => {
                const cloudMap = new Map(cloudItems.map(i => [i.id, mapper.fromSupabase(i)]));
                const localMap = new Map(localItems.map(i => [i.id, i]));

                const toImport: any[] = [];
                const toExport: any[] = [];

                for (const [id, cloudItem] of cloudMap) {
                    const localItem = localMap.get(id);
                    if (!localItem) {
                        toImport.push(cloudItem);
                    } else {
                        const cloudUpdatedAt = (cloudItem as { updatedAt?: Date | string }).updatedAt;
                        const localUpdatedAt = (localItem as { updatedAt?: Date | string }).updatedAt;
                        const comparison = compareDates(cloudUpdatedAt, localUpdatedAt);

                        if (comparison > 0) {
                            toImport.push(cloudItem);
                        } else if (comparison < 0) {
                            toExport.push(localItem);
                        }
                    }
                }

                for (const [id, localItem] of localMap) {
                    if (!cloudMap.has(id)) {
                        toExport.push(localItem);
                    }
                }

                // Apply changes using transaction with source='sync' to prevent loops
                if (toImport.length > 0) {
                    await db.transaction('rw', db[tableName], (trans) => {
                        (trans as unknown as { source: string }).source = 'sync';
                        return (db[tableName] as Table).bulkPut(toImport);
                    });
                }

                if (toExport.length > 0) {
                    let allowedFields: string[] | undefined;
                    // ... (allowedFields definition)
                    if (supabaseTableName === 'categories') {
                        allowedFields = ['id', 'name', 'parentId', 'level', 'isDefault', 'order', 'createdAt', 'updatedAt', 'icon'];
                    } else if (supabaseTableName === 'todos') {
                        allowedFields = ['id', 'title', 'completed', 'createdAt', 'updatedAt', 'dueDate', 'categoryId', 'estimatedDuration', 'actualDuration', 'priority', 'notes', 'tags', 'srsLevel', 'nextReviewDate', 'srsProfileId', 'reviewHistory', 'memo', 'range', 'srsInterval', 'srsGroupId'];
                    } else if (supabaseTableName === 'srs_profiles') {
                        allowedFields = ['id', 'name', 'intervals', 'isDefault', 'createdAt', 'updatedAt'];
                    } else if (supabaseTableName === 'sessions') {
                        allowedFields = ['id', 'todoId', 'todoTitle', 'startTime', 'endTime', 'duration', 'mode', 'createdAt'];
                    }

                    const mappedExports = toExport.map(item => mapper.toSupabase(item, uId, allowedFields));
                    const { error } = await supabase.from(supabaseTableName).upsert(mappedExports);
                    if (error) throw error;
                }

                return { imported: toImport.length, exported: toExport.length };
            };

            await processTable(localCategories, cloudCategories, 'categories', 'categories');
            await processTable(localSrs, cloudSrs, 'srsProfiles', 'srs_profiles');
            await processTable(localTodos, cloudTodos, 'todos', 'todos');
            await processTable(localSessions, cloudSessions, 'sessions', 'sessions');

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
                // Also set it on db directly for direct writes before sync finishes
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
    }, []);

    return { isSyncing, lastSyncTime, sync };
}
