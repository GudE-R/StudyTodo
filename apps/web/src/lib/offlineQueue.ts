/**
 * Web Offline Queue Implementation
 * IndexedDB (Dexie) を使用してオフライン中の変更をキューイング
 */

import Dexie, { Table } from 'dexie';
import { SyncQueueItem, SyncQueueInterface, allowedFieldsMap, supabaseTableMap, Mapper } from '@studytodo/shared';
import { SupabaseClient } from '@supabase/supabase-js';
import { generateId } from '@/lib/utils';

class OfflineQueueDB extends Dexie {
    syncQueue!: Table<SyncQueueItem>;

    constructor() {
        super('StudyTodoOfflineQueue');
        this.version(1).stores({
            syncQueue: 'id, table, createdAt'
        });
    }
}

const queueDb = new OfflineQueueDB();

export const offlineQueue: SyncQueueInterface = {
    async add(item) {
        const queueItem: SyncQueueItem = {
            id: generateId(),
            table: item.table,
            operation: item.operation,
            data: item.data,
            createdAt: new Date(),
            retryCount: 0
        };
        await queueDb.syncQueue.add(queueItem);
    },

    async getAll() {
        return await queueDb.syncQueue.orderBy('createdAt').toArray();
    },

    async remove(id) {
        await queueDb.syncQueue.delete(id);
    },

    async clear() {
        await queueDb.syncQueue.clear();
    },

    async incrementRetry(id) {
        const item = await queueDb.syncQueue.get(id);
        await queueDb.syncQueue.update(id, { retryCount: (item?.retryCount ?? 0) + 1 });
    }
};

/**
 * ネットワーク状態を監視し、オンライン復帰時にキューを処理
 */
export function initNetworkListener(processQueue: () => Promise<void>) {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', async () => {
        await processQueue();
    });

    // 初期状態がオンラインならキュー処理
    if (navigator.onLine) {
        processQueue();
    }
}

/**
 * キュー内のアイテムを順番に送信
 */
export async function processOfflineQueue(
    userId: string,
    supabase: SupabaseClient,
    mapper: Mapper
): Promise<void> {
    // 認証状態を確認
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
        console.warn('[OfflineQueue] No active session, skipping queue processing');
        return;
    }

    const items = await offlineQueue.getAll();
    if (items.length === 0) return;

    // allowedFieldsMap と supabaseTableMap は @studytodo/shared からインポート

    for (const item of items) {
        try {
            const supabaseTable = supabaseTableMap[item.table] || item.table;

            if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
                const mapped = mapper.toSupabase(item.data, userId, allowedFieldsMap[item.table]);
                const { error } = await supabase.from(supabaseTable).upsert(mapped);
                if (error) throw error;
            } else if (item.operation === 'DELETE') {
                const { error } = await supabase.from(supabaseTable).delete().eq('id', item.data.id);
                if (error) throw error;
            }

            await offlineQueue.remove(item.id);
        } catch (err) {
            const error = err as { message?: string; code?: string; details?: string; hint?: string };
            console.error('[OfflineQueue] Failed to process item:', item.id, {
                message: error?.message || 'Unknown error',
                code: error?.code,
                details: error?.details,
                hint: error?.hint,
            });
            await offlineQueue.incrementRetry(item.id);

            // 3回以上リトライ失敗したらスキップ
            if ((item.retryCount ?? 0) >= 3) {
                console.warn('[OfflineQueue] Max retries reached, removing item:', item.id);
                await offlineQueue.remove(item.id);
            }
        }
    }
}

export function isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
}
