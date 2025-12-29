/**
 * Offline Sync Queue Types and Interface
 * ネットワーク切断時の変更をキューイングし、復帰時に送信する仕組み
 */

export type SyncOperationType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface SyncQueueItem {
    id: string;
    table: string;
    operation: SyncOperationType;
    data: any;
    createdAt: Date;
    retryCount: number;
}

export interface SyncQueueInterface {
    add(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<void>;
    getAll(): Promise<SyncQueueItem[]>;
    remove(id: string): Promise<void>;
    clear(): Promise<void>;
    incrementRetry(id: string): Promise<void>;
}
