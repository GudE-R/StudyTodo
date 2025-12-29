/**
 * Web Offline Queue Implementation
 * IndexedDB (Dexie) を使用してオフライン中の変更をキューイング
 */

import Dexie, { Table } from 'dexie';
import { SyncQueueItem, SyncQueueInterface, SyncOperationType } from '@pomarc/shared';
import { generateId } from '@/lib/utils';

class OfflineQueueDB extends Dexie {
    syncQueue!: Table<SyncQueueItem>;

    constructor() {
        super('PomArcOfflineQueue');
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
        console.log('[OfflineQueue] Added item:', queueItem.id, item.table, item.operation);
    },

    async getAll() {
        return await queueDb.syncQueue.orderBy('createdAt').toArray();
    },

    async remove(id) {
        await queueDb.syncQueue.delete(id);
        console.log('[OfflineQueue] Removed item:', id);
    },

    async clear() {
        await queueDb.syncQueue.clear();
        console.log('[OfflineQueue] Cleared all items');
    },

    async incrementRetry(id) {
        await queueDb.syncQueue.update(id, { retryCount: (await queueDb.syncQueue.get(id))?.retryCount ?? 0 + 1 });
    }
};

/**
 * ネットワーク状態を監視し、オンライン復帰時にキューを処理
 */
export function initNetworkListener(processQueue: () => Promise<void>) {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', async () => {
        console.log('[OfflineQueue] Network restored, processing queue...');
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
    supabase: any,
    mapper: any
): Promise<void> {
    const items = await offlineQueue.getAll();
    if (items.length === 0) return;

    console.log(`[OfflineQueue] Processing ${items.length} queued items...`);

    const supabaseTableMap: Record<string, string> = {
        'todos': 'todos',
        'categories': 'categories',
        'srsProfiles': 'srs_profiles',
        'sessions': 'sessions'
    };

    const allowedFieldsMap: Record<string, string[]> = {
        'todos': ['id', 'title', 'completed', 'createdAt', 'updatedAt', 'dueDate', 'categoryId', 'estimatedDuration', 'actualDuration', 'priority', 'notes', 'tags', 'srsLevel', 'nextReviewDate', 'srsProfileId', 'reviewHistory', 'memo', 'range', 'srsInterval', 'srsGroupId'],
        'categories': ['id', 'name', 'parentId', 'level', 'isDefault', 'order', 'createdAt', 'updatedAt', 'icon'],
        'srsProfiles': ['id', 'name', 'intervals', 'isDefault', 'createdAt', 'updatedAt'],
        'sessions': ['id', 'todoId', 'todoTitle', 'startTime', 'endTime', 'duration', 'mode', 'createdAt']
    };

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
            console.error('[OfflineQueue] Failed to process item:', item.id, err);
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
