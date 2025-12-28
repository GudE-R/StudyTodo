import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRepository } from '../providers/RepositoryProvider';
import { mapper } from '../lib/mapper';
import { SQLiteRepository } from '../repositories/SQLiteRepository';

export function useMobileRealtimeSync(userId: string | undefined) {
    const repo = useRepository() as SQLiteRepository;
    const isProcessingCloudChange = useRef(false);

    useEffect(() => {
        if (!userId) return;

        console.log('Initializing Mobile Realtime Sync...');

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

        // 2. Subscribe to Local Repository Changes (Sender/Push)
        repo.onDataChange(async (table: string, type: 'INSERT' | 'UPDATE' | 'DELETE', data: any) => {
            // Skip if this change was triggered by the cloud sync above or by a full sync
            if (isProcessingCloudChange.current) return;

            console.log(`Mobile: Local change detected in ${table}:`, type);

            try {
                if (type === 'INSERT' || type === 'UPDATE') {
                    // Define allowed fields to match Supabase schema
                    let allowedFields: string[] | undefined;
                    if (table === 'todos') allowedFields = ['id', 'title', 'completed', 'createdAt', 'updatedAt', 'dueDate', 'categoryId', 'estimatedDuration', 'actualDuration', 'priority', 'notes', 'tags', 'srsLevel', 'nextReviewDate', 'srsProfileId', 'reviewHistory', 'memo', 'range', 'srsInterval', 'srsGroupId'];
                    else if (table === 'categories') allowedFields = ['id', 'name', 'parentId', 'level', 'isDefault', 'order', 'createdAt', 'updatedAt', 'icon'];
                    else if (table === 'srs_profiles') allowedFields = ['id', 'name', 'intervals', 'isDefault', 'createdAt', 'updatedAt'];
                    else if (table === 'sessions') allowedFields = ['id', 'todoId', 'todoTitle', 'startTime', 'endTime', 'duration', 'mode', 'createdAt'];

                    const mapped = mapper.toSupabase(data, userId, allowedFields);
                    const { error } = await supabase.from(table).upsert(mapped);
                    if (error) console.error(`Error pushing ${table} to cloud:`, error);
                } else if (type === 'DELETE') {
                    const { error } = await supabase.from(table).delete().eq('id', data.id);
                    if (error) console.error(`Error deleting ${table} from cloud:`, error);
                }
            } catch (err) {
                console.error('Error in onDataChange push:', err);
            }
        });

        return () => {
            channels.forEach(ch => supabase.removeChannel(ch));
        };
    }, [userId, repo]);
}
