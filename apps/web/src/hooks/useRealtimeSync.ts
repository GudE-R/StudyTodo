import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { mapper, compareDates } from '@pomarc/shared';

export function useRealtimeSync(userId: string | undefined) {
    useEffect(() => {
        if (!userId) return;

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
                        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                            const cloudItem = mapper.fromSupabase(payload.new);

                            // Get local item to compare updatedAt
                            // @ts-ignore
                            const localItem = await db[table.dexie].get(cloudItem.id);

                            const cloudUpdatedAt = (cloudItem as { updatedAt?: Date | string }).updatedAt;
                            const localUpdatedAt = (localItem as { updatedAt?: Date | string } | undefined)?.updatedAt;

                            if (!localItem || compareDates(cloudUpdatedAt, localUpdatedAt) > 0) {
                                // @ts-ignore
                                await db[table.dexie].put(cloudItem);
                            }
                        } else if (payload.eventType === 'DELETE') {
                            const oldItem = payload.old;
                            // @ts-ignore
                            await db[table.dexie].delete(oldItem.id);
                        }
                    }
                )
                .subscribe();
        });

        return () => {
            channels.forEach(channel => {
                supabase.removeChannel(channel);
            });
        };
    }, [userId]);
}
