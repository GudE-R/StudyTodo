import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { mapper } from "../lib/mapper";
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
        console.log("Starting Mobile Full Sync...");

        try {
            // ... (existing sync content - fetching cloud/local)
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
            const localCategories = await repo.getCategories();
            const localSrs = await repo.getSRSProfiles();

            const processTable = async (
                localItems: any[],
                cloudItems: any[],
                repoMethods: {
                    add: (item: any) => Promise<void>,
                    update: (id: string, updates: any) => Promise<void>
                },
                supabaseTableName: string
            ) => {
                const cloudMap = new Map(cloudItems.map(i => [i.id, mapper.fromSupabase(i)]));
                const localMap = new Map(localItems.map(i => [i.id, i]));

                const toImport: any[] = [];
                const toUpdateLocal: any[] = [];
                const toExport: any[] = [];

                for (const [id, cloudItem] of cloudMap) {
                    const localItem = localMap.get(id);
                    if (!localItem) {
                        toImport.push(cloudItem);
                    } else {
                        // Safely parse dates with validation
                        const cloudDate = cloudItem.updatedAt ? new Date(cloudItem.updatedAt) : null;
                        const localDate = localItem.updatedAt ? new Date(localItem.updatedAt) : null;
                        const cloudTime = (cloudDate && !isNaN(cloudDate.getTime())) ? cloudDate.getTime() : 0;
                        const localTime = (localDate && !isNaN(localDate.getTime())) ? localDate.getTime() : 0;

                        if (cloudTime > localTime) {
                            toUpdateLocal.push(cloudItem);
                        } else if (localTime > cloudTime) {
                            toExport.push(localItem);
                        }
                    }
                }

                for (const [id, localItem] of localMap) {
                    if (!cloudMap.has(id)) {
                        toExport.push(localItem);
                    }
                }

                for (const item of toImport) {
                    await repoMethods.add(item);
                }
                for (const item of toUpdateLocal) {
                    await repoMethods.update(item.id, item);
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
                    }
                    const mappedExports = toExport.map(item => mapper.toSupabase(item, uId, allowedFields));
                    const { error } = await supabase.from(supabaseTableName).upsert(mappedExports);
                    if (error) throw error;
                }
            };

            await processTable(localCategories, cloudCategories, { add: (i) => repo.addCategory(i), update: (id, u) => repo.updateCategory(id, u) }, 'categories');
            await processTable(localSrs, cloudSrs, { add: (i) => repo.addSRSProfile(i), update: (id, u) => repo.updateSRSProfile(id, u) }, 'srs_profiles');
            await processTable(localTodos, cloudTodos, { add: (i) => repo.addTodo(i), update: (id, u) => repo.updateTodo(id, u) }, 'todos');

            // Sessions logic
            const sessionCloudMap = new Map(cloudSessions.map(i => [i.id, mapper.fromSupabase(i)]));
            const sessionLocalMap = new Map(localSessions.map(i => [i.id, i]));
            for (const [id, cloudItem] of sessionCloudMap) {
                if (!sessionLocalMap.has(id)) await repo.addSession(cloudItem);
            }
            const sessionsToExport = localSessions.filter(s => !sessionCloudMap.has(s.id));
            if (sessionsToExport.length > 0) {
                const allowedSessionFields = ['id', 'todoId', 'todoTitle', 'startTime', 'endTime', 'duration', 'mode', 'createdAt'];
                const mappedExports = sessionsToExport.map(item => mapper.toSupabase(item, uId, allowedSessionFields));
                await supabase.from('sessions').upsert(mappedExports);
            }

            console.log("Mobile Full Sync Complete.");
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
            }
        });

        return () => subscription.unsubscribe();
    }, []);


    return { isSyncing, lastSyncTime, sync };
}
