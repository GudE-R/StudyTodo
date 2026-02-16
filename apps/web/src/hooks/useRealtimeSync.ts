import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { mapper, compareDates } from '@studytodo/shared';
import { Table } from 'dexie';

type DexieTableName = 'todos' | 'categories' | 'srsProfiles' | 'sessions';

function getTable(name: DexieTableName): Table {
    return db[name] as Table;
}

export function useRealtimeSync(userId: string | undefined) {
    useEffect(() => {
        if (!userId) return;

        const tables = [
            { supabase: 'todos', dexie: 'todos' as DexieTableName },
            { supabase: 'categories', dexie: 'categories' as DexieTableName },
            { supabase: 'srs_profiles', dexie: 'srsProfiles' as DexieTableName },
            { supabase: 'sessions', dexie: 'sessions' as DexieTableName }
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
                        const dexieTable = getTable(table.dexie);

                        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                            const cloudItem = mapper.fromSupabase(payload.new);

                            // Get local item to compare updatedAt
                            const localItem = await dexieTable.get(cloudItem.id);

                            const cloudUpdatedAt = (cloudItem as { updatedAt?: Date | string }).updatedAt;
                            const localUpdatedAt = (localItem as { updatedAt?: Date | string } | undefined)?.updatedAt;

                            if (!localItem || compareDates(cloudUpdatedAt, localUpdatedAt) > 0) {
                                await dexieTable.put(cloudItem);
                            }
                        } else if (payload.eventType === 'DELETE') {
                            const oldItem = payload.old;
                            await dexieTable.delete(oldItem.id);
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
