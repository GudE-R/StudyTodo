import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { mapper } from '@/lib/mapper';

export function useRealtimeSync(userId: string | undefined) {
    useEffect(() => {
        if (!userId) return;

        console.log('Initializing Realtime Sync Subscriptions...');

        const tables = [
            { supabase: 'todos', dexie: 'todos' },
            { supabase: 'categories', dexie: 'categories' },
            { supabase: 'srs_profiles', dexie: 'srsProfiles' },
            { supabase: 'sessions', dexie: 'sessions' }
        ];

        const channels = tables.map(table => {
            return supabase
                .channel(`public:${table.supabase}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: table.supabase,
                        filter: `user_id=eq.${userId}`
                    },
                    async (payload) => {
                        console.log(`Realtime change in ${table.supabase}:`, payload);

                        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                            const cloudItem = mapper.fromSupabase(payload.new);
                            console.log(`Web: Cloud update received for ${table.dexie}:`, cloudItem.id);

                            // Get local item to compare updatedAt
                            // @ts-ignore
                            const localItem = await db[table.dexie].get(cloudItem.id);

                            if (!localItem || new Date(cloudItem.updatedAt || 0).getTime() > new Date(localItem.updatedAt || 0).getTime()) {
                                console.log(`Applying realtime update to ${table.dexie}:`, cloudItem.id);
                                // @ts-ignore
                                await db[table.dexie].put(cloudItem);
                            }
                        } else if (payload.eventType === 'DELETE') {
                            const oldItem = payload.old;
                            console.log(`Web: Cloud deletion detected in ${table.dexie}:`, oldItem.id);
                            // @ts-ignore
                            await db[table.dexie].delete(oldItem.id);
                        }
                    }
                )
                .subscribe((status) => {
                    console.log(`[WebSync] Channel ${table.supabase} status: ${status}`);
                });
        });

        return () => {
            channels.forEach(channel => {
                supabase.removeChannel(channel);
            });
        };
    }, [userId]);
}
