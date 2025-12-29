import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRepository } from '../providers/RepositoryProvider';
import { mapper } from '../lib/mapper';
import { SQLiteRepository } from '../repositories/SQLiteRepository';
import { offlineQueue } from '../repositories/OfflineQueueRepository';
import * as Network from 'expo-network';

// Helper to check network status
async function isOnline(): Promise<boolean> {
    try {
        const state = await Network.getNetworkStateAsync();
        return state.isConnected === true && state.isInternetReachable === true;
    } catch {
        return true; // Assume online if check fails
    }
}

// Process queued items
async function processOfflineQueue(userId: string): Promise<void> {
    const items = await offlineQueue.getAll();
    if (items.length === 0) return;

    console.log(`[MobileOfflineQueue] Processing ${items.length} queued items...`);

    const allowedFieldsMap: Record<string, string[]> = {
        'todos': ['id', 'title', 'completed', 'createdAt', 'updatedAt', 'dueDate', 'categoryId', 'estimatedDuration', 'actualDuration', 'priority', 'notes', 'tags', 'srsLevel', 'nextReviewDate', 'srsProfileId', 'reviewHistory', 'memo', 'range', 'srsInterval', 'srsGroupId'],
        'categories': ['id', 'name', 'parentId', 'level', 'isDefault', 'order', 'createdAt', 'updatedAt', 'icon'],
        'srs_profiles': ['id', 'name', 'intervals', 'isDefault', 'createdAt', 'updatedAt'],
        'sessions': ['id', 'todoId', 'todoTitle', 'startTime', 'endTime', 'duration', 'mode', 'createdAt']
    };

    for (const item of items) {
        try {
            if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
                const mapped = mapper.toSupabase(item.data, userId, allowedFieldsMap[item.table]);
                const { error } = await supabase.from(item.table).upsert(mapped);
                if (error) throw error;
            } else if (item.operation === 'DELETE') {
                const { error } = await supabase.from(item.table).delete().eq('id', item.data.id);
                if (error) throw error;
            }

            await offlineQueue.remove(item.id);
        } catch (err) {
            console.error('[MobileOfflineQueue] Failed to process item:', item.id, err);
            await offlineQueue.incrementRetry(item.id);

            if ((item.retryCount ?? 0) >= 3) {
                console.warn('[MobileOfflineQueue] Max retries reached, removing item:', item.id);
                await offlineQueue.remove(item.id);
            }
        }
    }
}

export function useMobileRealtimeSync(userId: string | undefined) {
    const repo = useRepository() as SQLiteRepository;
    const isProcessingCloudChange = useRef(false);

    useEffect(() => {
        if (!userId) return;

        console.log('Initializing Mobile Realtime Sync...');

        // Process any pending offline changes on startup
        processOfflineQueue(userId);

        const tableConfigs = [
            { supabase: 'todos', sqlite: 'todos' },
            { supabase: 'categories', sqlite: 'categories' },
            { supabase: 'srs_profiles', sqlite: 'srs_profiles' },
            { supabase: 'sessions', sqlite: 'sessions' }
        ];

        // 1. Subscribe to Supabase Changes (Receiver)
        const channels = tableConfigs.map(config => {
            return supabase
                .channel(`mobile:${config.supabase}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: config.supabase,
                        filter: `user_id=eq.${userId}`
                    },
                    async (payload) => {
                        console.log(`Mobile: Cloud change detected in ${config.supabase}:`, payload.eventType);

                        isProcessingCloudChange.current = true;
                        try {
                            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                                const cloudItem = mapper.fromSupabase(payload.new);

                                // Fetch local item to compare
                                let localItem: any;
                                if (config.sqlite === 'todos') localItem = await repo.getTodo(cloudItem.id);
                                else if (config.sqlite === 'categories') {
                                    const cats = await repo.getCategories();
                                    localItem = cats.find(c => c.id === cloudItem.id);
                                } else if (config.sqlite === 'srs_profiles') {
                                    const profiles = await repo.getSRSProfiles();
                                    localItem = profiles.find(p => p.id === cloudItem.id);
                                } else if (config.sqlite === 'sessions') {
                                    const sessions = await repo.getSessions();
                                    localItem = sessions.find(s => s.id === cloudItem.id);
                                }

                                const cloudTime = new Date(cloudItem.updatedAt || 0).getTime();
                                const localTime = new Date(localItem?.updatedAt || 0).getTime();

                                if (!localItem || cloudTime > localTime) {
                                    console.log(`Mobile: Applying cloud update to ${config.sqlite}:`, cloudItem.id);
                                    if (config.sqlite === 'todos') {
                                        if (!localItem) await repo.addTodo(cloudItem);
                                        else await repo.updateTodo(cloudItem.id, cloudItem);
                                    } else if (config.sqlite === 'categories') {
                                        if (!localItem) await repo.addCategory(cloudItem);
                                        else await repo.updateCategory(cloudItem.id, cloudItem);
                                    } else if (config.sqlite === 'srs_profiles') {
                                        if (!localItem) await repo.addSRSProfile(cloudItem);
                                        else await repo.updateSRSProfile(cloudItem.id, cloudItem);
                                    } else if (config.sqlite === 'sessions') {
                                        if (!localItem) await repo.addSession(cloudItem);
                                    }
                                }
                            } else if (payload.eventType === 'DELETE') {
                                // For now, we don't handle hard deletes from cloud to avoid accidental data loss
                            }
                        } catch (err) {
                            console.error('Error processing cloud change:', err);
                        } finally {
                            isProcessingCloudChange.current = false;
                        }
                    }
                )
                .subscribe();
        });

        // 2. Subscribe to Local Repository Changes (Sender/Push with Offline Queue)
        repo.onDataChange(async (table: string, type: 'INSERT' | 'UPDATE' | 'DELETE', data: any) => {
            // Skip if this change was triggered by the cloud sync above or by a full sync
            if (isProcessingCloudChange.current) return;

            console.log(`Mobile: Local change detected in ${table}:`, type);

            // Define allowed fields to match Supabase schema
            let allowedFields: string[] | undefined;
            if (table === 'todos') allowedFields = ['id', 'title', 'completed', 'createdAt', 'updatedAt', 'dueDate', 'categoryId', 'estimatedDuration', 'actualDuration', 'priority', 'notes', 'tags', 'srsLevel', 'nextReviewDate', 'srsProfileId', 'reviewHistory', 'memo', 'range', 'srsInterval', 'srsGroupId'];
            else if (table === 'categories') allowedFields = ['id', 'name', 'parentId', 'level', 'isDefault', 'order', 'createdAt', 'updatedAt', 'icon'];
            else if (table === 'srs_profiles') allowedFields = ['id', 'name', 'intervals', 'isDefault', 'createdAt', 'updatedAt'];
            else if (table === 'sessions') allowedFields = ['id', 'todoId', 'todoTitle', 'startTime', 'endTime', 'duration', 'mode', 'createdAt'];

            try {
                // Check network status
                const online = await isOnline();

                if (!online) {
                    console.log('[Mobile] Offline, queuing change:', table, type);
                    await offlineQueue.add({ table, operation: type, data });
                    return;
                }

                if (type === 'INSERT' || type === 'UPDATE') {
                    const mapped = mapper.toSupabase(data, userId, allowedFields);
                    const { error } = await supabase.from(table).upsert(mapped);
                    if (error) {
                        console.warn(`[Mobile] Push failed, queuing:`, error.message);
                        await offlineQueue.add({ table, operation: type, data });
                    }
                } else if (type === 'DELETE') {
                    const { error } = await supabase.from(table).delete().eq('id', data.id);
                    if (error) {
                        console.warn(`[Mobile] Delete failed, queuing:`, error.message);
                        await offlineQueue.add({ table, operation: type, data });
                    }
                }
            } catch (err) {
                console.error('Error in onDataChange push, queuing:', err);
                await offlineQueue.add({ table, operation: type, data });
            }
        });

        return () => {
            channels.forEach(ch => supabase.removeChannel(ch));
        };
    }, [userId, repo]);
}
