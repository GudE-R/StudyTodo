import * as SQLite from 'expo-sqlite';
import { SyncQueueItem, SyncQueueInterface, SyncOperationType } from '@pomarc/shared';
import * as Crypto from 'expo-crypto';

/**
 * Mobile Offline Queue Implementation
 * SQLite を使用してオフライン中の変更をキューイング
 */
export class OfflineQueueRepository implements SyncQueueInterface {
    private db: SQLite.SQLiteDatabase;

    constructor() {
        this.db = SQLite.openDatabaseSync('pomarc.db');
        this.init();
    }

    private init() {
        this.db.execSync(`
            CREATE TABLE IF NOT EXISTS sync_queue (
                id TEXT PRIMARY KEY,
                tableName TEXT NOT NULL,
                operation TEXT NOT NULL,
                data TEXT NOT NULL,
                createdAt TEXT NOT NULL,
                retryCount INTEGER DEFAULT 0
            );
        `);
    }

    async add(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
        const id = Crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const dataJson = JSON.stringify(item.data);

        this.db.runSync(
            'INSERT INTO sync_queue (id, tableName, operation, data, createdAt, retryCount) VALUES (?, ?, ?, ?, ?, ?)',
            [id, item.table, item.operation, dataJson, createdAt, 0]
        );
        console.log('[OfflineQueue] Added item:', id, item.table, item.operation);
    }

    async getAll(): Promise<SyncQueueItem[]> {
        const rows = this.db.getAllSync<{
            id: string;
            tableName: string;
            operation: string;
            data: string;
            createdAt: string;
            retryCount: number;
        }>('SELECT * FROM sync_queue ORDER BY createdAt ASC');

        return rows.map(row => ({
            id: row.id,
            table: row.tableName,
            operation: row.operation as SyncOperationType,
            data: JSON.parse(row.data),
            createdAt: new Date(row.createdAt),
            retryCount: row.retryCount
        }));
    }

    async remove(id: string): Promise<void> {
        this.db.runSync('DELETE FROM sync_queue WHERE id = ?', [id]);
        console.log('[OfflineQueue] Removed item:', id);
    }

    async clear(): Promise<void> {
        this.db.runSync('DELETE FROM sync_queue');
        console.log('[OfflineQueue] Cleared all items');
    }

    async incrementRetry(id: string): Promise<void> {
        this.db.runSync('UPDATE sync_queue SET retryCount = retryCount + 1 WHERE id = ?', [id]);
    }
}

export const offlineQueue = new OfflineQueueRepository();
