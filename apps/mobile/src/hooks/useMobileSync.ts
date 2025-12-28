import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { mapper } from "../lib/mapper";
import { useRepository } from "../providers/RepositoryProvider";

export function useMobileSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const repo = useRepository();

    const sync = async (userId: string) => {
        if (isSyncing) return;
        setIsSyncing(true);
        console.log("Starting Mobile Sync...");

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

            // SQLite (Local)
            const localTodos = await repo.getTodos();
            const localSessions = await repo.getSessions();
            const localCategories = await repo.getCategories();
            const localSrs = await repo.getSRSProfiles();

            // 2. Merge Logic (Last Write Wins)
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

                // Check Cloud items against Local
                for (const [id, cloudItem] of cloudMap) {
                    const localItem = localMap.get(id);
                    if (!localItem) {
                        // Cloud has it, Local doesn't -> Import (Add new)
                        toImport.push(cloudItem);
                    } else {
                        // Both have it -> Compare updatedAt
                        const cloudTime = new Date(cloudItem.updatedAt || 0).getTime();
                        const localTime = new Date(localItem.updatedAt || 0).getTime();

                        if (cloudTime > localTime) {
                            // Cloud is newer -> Update Local
                            toUpdateLocal.push(cloudItem);
                        } else if (localTime > cloudTime) {
                            // Local is newer -> Export (Push)
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

                // Import (Add) to SQLite
                for (const item of toImport) {
                    await repoMethods.add(item);
                }

                // Update SQLite
                for (const item of toUpdateLocal) {
                    await repoMethods.update(item.id, item);
                }

                // Export to Supabase
                if (toExport.length > 0) {
                    // Define allowed fields per table to avoid sending extraneous props (like 'completed' to categories)
                    // This is a manual mapping, ideally could be inferred from types but runtime check is safer here.
                    let allowedFields: string[] | undefined;

                    if (supabaseTableName === 'categories') {
                        allowedFields = ['id', 'name', 'parentId', 'level', 'isDefault', 'order', 'createdAt', 'updatedAt', 'icon'];
                    } else if (supabaseTableName === 'todos') {
                        // Explicitly list fields to avoid schematic mismatch
                        allowedFields = [
                            'id', 'title', 'completed', 'createdAt', 'updatedAt', 'dueDate',
                            'categoryId', 'estimatedDuration', 'actualDuration', 'priority', 'notes',
                            'tags', 'srsLevel', 'nextReviewDate', 'srsProfileId', 'reviewHistory',
                            'memo', 'range', 'srsInterval', 'srsGroupId'
                        ];
                    } else if (supabaseTableName === 'srs_profiles') {
                        allowedFields = ['id', 'name', 'intervals', 'isDefault', 'createdAt', 'updatedAt'];
                    }

                    const mappedExports = toExport.map(item => mapper.toSupabase(item, userId, allowedFields));
                    const { error } = await supabase.from(supabaseTableName).upsert(mappedExports);
                    if (error) throw error;
                }

                return {
                    imported: toImport.length + toUpdateLocal.length,
                    exported: toExport.length
                };
            };

            await processTable(localCategories, cloudCategories, {
                add: (i) => repo.addCategory(i),
                update: (id, u) => repo.updateCategory(id, u)
            }, 'categories');

            await processTable(localSrs, cloudSrs, {
                add: (i) => repo.addSRSProfile(i),
                update: (id, u) => repo.updateSRSProfile(id, u)
            }, 'srs_profiles');

            await processTable(localTodos, cloudTodos, {
                add: (i) => repo.addTodo(i),
                update: (id, u) => repo.updateTodo(id, u)
            }, 'todos');

            // Sessions logic needs adjustment as sessions might not have update methods or updatedAt usually.
            // Assuming sessions are append-only mostly, but migration/sync logic might need update.
            // Repository doesn't have updateSession. Let's assume sessions are immutable for now or handled via add if missing.
            // For simplicity, we only sync NEW sessions from Cloud -> Local. 
            // If we need bidirectional, we need check if it exists in local.
            const sessionCloudMap = new Map(cloudSessions.map(i => [i.id, mapper.fromSupabase(i)]));
            const sessionLocalMap = new Map(localSessions.map(i => [i.id, i]));
            const sessionsToImport: any[] = [];
            const sessionsToExport: any[] = [];

            for (const [id, cloudItem] of sessionCloudMap) {
                if (!sessionLocalMap.has(id)) {
                    sessionsToImport.push(cloudItem);
                }
            }
            for (const [id, localItem] of sessionLocalMap) {
                if (!sessionCloudMap.has(id)) {
                    sessionsToExport.push(localItem);
                }
            }

            for (const item of sessionsToImport) {
                await repo.addSession(item);
            }
            if (sessionsToExport.length > 0) {
                const allowedSessionFields = ['id', 'todoId', 'todoTitle', 'startTime', 'endTime', 'duration', 'mode', 'createdAt'];
                const mappedExports = sessionsToExport.map(item => mapper.toSupabase(item, userId, allowedSessionFields));
                await supabase.from('sessions').upsert(mappedExports);
            }

            console.log("Mobile Sync Complete.");
            setLastSyncTime(new Date());

        } catch (error) {
            console.error("Sync Error:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    // Auto-sync on Auth State Change
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
