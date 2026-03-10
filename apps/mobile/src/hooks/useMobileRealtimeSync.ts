import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRepository } from '../providers/RepositoryProvider';
import { mapper, allowedFieldsMap, compareDates, Todo, Category, SRSProfile, Session } from '@studytodo/shared';
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

    if (__DEV__) console.log(`[MobileOfflineQueue] Processing ${items.length} queued items...`);

    // allowedFieldsMap は @studytodo/shared からインポート

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

        if (__DEV__) console.log('Initializing Mobile Realtime Sync...');

        // Process any pending offline changes on startup
        processOfflineQueue(userId);

        const tableConfigs = [
            { supabase: 'todos', sqlite: 'todos' },
            { supabase: 'categories', sqlite: 'categories' },
            { supabase: 'srs_profiles', sqlite: 'srsProfiles' },
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
                        if (__DEV__) console.log(`Mobile: Cloud change detected in ${config.supabase}:`, payload.eventType);

                        isProcessingCloudChange.current = true;
                        try {
                            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                                const rawCloudItem = mapper.fromSupabase(payload.new);
                                const cloudItemId = rawCloudItem.id as string;

                                // Fetch local item to compare
                                let localItem: any;
                                if (config.sqlite === 'todos') localItem = await repo.getTodo(cloudItemId);
                                else if (config.sqlite === 'categories') {
                                    const cats = await repo.getCategories();
                                    localItem = cats.find(c => c.id === cloudItemId);
                                } else if (config.sqlite === 'srsProfiles') {
                                    const profiles = await repo.getSRSProfiles();
                                    localItem = profiles.find(p => p.id === cloudItemId);
                                } else if (config.sqlite === 'sessions') {
                                    const sessions = await repo.getSessions();
                                    localItem = sessions.find(s => s.id === cloudItemId);
                                }

                                // Use shared compareDates utility
                                const cloudUpdatedAt = rawCloudItem.updatedAt as Date | string | undefined;
                                const localUpdatedAt = localItem?.updatedAt;
                                const shouldUpdate = !localItem || compareDates(cloudUpdatedAt, localUpdatedAt) > 0;

                                if (shouldUpdate) {
                                    if (__DEV__) console.log(`Mobile: Applying cloud update to ${config.sqlite}:`, cloudItemId);
                                    if (config.sqlite === 'todos') {
                                        const cloudItem = rawCloudItem as unknown as Todo;
                                        if (!localItem) await repo.addTodo(cloudItem);
                                        else await repo.updateTodo(cloudItemId, cloudItem);
                                    } else if (config.sqlite === 'categories') {
                                        const cloudItem = rawCloudItem as unknown as Category;
                                        if (!localItem) await repo.addCategory(cloudItem);
                                        else await repo.updateCategory(cloudItemId, cloudItem);
                                    } else if (config.sqlite === 'srsProfiles') {
                                        const cloudItem = rawCloudItem as unknown as SRSProfile;
                                        if (!localItem) await repo.addSRSProfile(cloudItem);
                                        else await repo.updateSRSProfile(cloudItemId, cloudItem);
                                    } else if (config.sqlite === 'sessions') {
                                        const cloudItem = rawCloudItem as unknown as Session;
                                        if (!localItem) await repo.addSession(cloudItem);
                                    }
                                }
                            } else if (payload.eventType === 'DELETE') {
                                const oldItem = payload.old;
                                if (__DEV__) console.log(`Mobile: Cloud deletion detected in ${config.sqlite}:`, oldItem.id);
                                if (config.sqlite === 'todos') await repo.deleteTodo(oldItem.id);
                                else if (config.sqlite === 'categories') await repo.deleteCategory(oldItem.id);
                                else if (config.sqlite === 'srsProfiles') await repo.deleteSRSProfile(oldItem.id);
                            }
                        } catch (err) {
                            console.error('Error processing cloud change:', err);
                        } finally {
                            isProcessingCloudChange.current = false;
                        }
                    }
                )
                .subscribe((status) => {
                    if (__DEV__) console.log(`[MobileSync] Channel ${config.supabase} status: ${status}`);
                });
        });

        // 2. Subscribe to Local Repository Changes (Sender/Push with Offline Queue)
        const unsubscribeDataChange = repo.onDataChange(async (table: string, type: 'INSERT' | 'UPDATE' | 'DELETE', data: any | any[]) => {
            // Skip if this change was triggered by the cloud sync above or by a full sync
            if (isProcessingCloudChange.current) return;

            if (__DEV__) console.log(`Mobile: Local change detected in ${table}:`, type);

            // allowedFieldsMap から取得
            const allowedFields = allowedFieldsMap[table];

            try {
                // セッションの有効性を確認
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    if (__DEV__) console.warn('[Mobile] No valid session, queuing change');
                    const dataArray = Array.isArray(data) ? data : [data];
                    for (const item of dataArray) {
                        await offlineQueue.add({ table, operation: type, data: item });
                    }
                    return;
                }

                // Check network status
                const online = await isOnline();
                const dataArray = Array.isArray(data) ? data : [data];

                if (!online) {
                    if (__DEV__) console.log('[Mobile] Offline, queuing change:', table, type, 'count:', dataArray.length);
                    for (const item of dataArray) {
                        await offlineQueue.add({ table, operation: type, data: item });
                    }
                    return;
                }

                if (type === 'INSERT' || type === 'UPDATE') {
                    const mappedArray = dataArray.map(item => mapper.toSupabase(item, userId, allowedFields));
                    const { error } = await supabase.from(table).upsert(mappedArray);
                    if (error) {
                        console.warn(`[Mobile] Push failed, queuing:`, error.message);
                        for (const item of dataArray) {
                            await offlineQueue.add({ table, operation: type, data: item });
                        }
                    }
                } else if (type === 'DELETE') {
                    for (const item of dataArray) {
                        const { error } = await supabase.from(table).delete().eq('id', item.id);
                        if (error) {
                            console.warn(`[Mobile] Delete failed, queuing:`, error.message);
                            await offlineQueue.add({ table, operation: type, data: item });
                        }
                    }
                }
            } catch (err) {
                console.error('Error in onDataChange push, queuing:', err);
                const dataArray = Array.isArray(data) ? data : [data];
                for (const item of dataArray) {
                    await offlineQueue.add({ table, operation: type, data: item });
                }
            }
        });

        return () => {
            channels.forEach(ch => supabase.removeChannel(ch));
            unsubscribeDataChange();
        };
    }, [userId, repo]);
}
