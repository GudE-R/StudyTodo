import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import * as SQLite from 'expo-sqlite';
import { OfflineQueueRepository } from '../OfflineQueueRepository';

// --- Mock DB type for type-safe access ---
interface MockDb {
    execSync: Mock;
    getAllAsync: Mock<(...args: any[]) => Promise<Record<string, any>[]>>;
    getAllSync: Mock<(...args: any[]) => Record<string, any>[]>;
    getFirstAsync: Mock<(...args: any[]) => Promise<Record<string, any> | null>>;
    runAsync: Mock<(...args: any[]) => Promise<{ lastInsertRowId: number; changes: number }>>;
    runSync: Mock<(...args: any[]) => { lastInsertRowId: number; changes: number }>;
}

const sharedMockDb: MockDb = {
    execSync: vi.fn(),
    getAllAsync: vi.fn((): Promise<Record<string, any>[]> => Promise.resolve([])),
    getAllSync: vi.fn((): Record<string, any>[] => []),
    getFirstAsync: vi.fn((): Promise<Record<string, any> | null> => Promise.resolve(null)),
    runAsync: vi.fn((): Promise<{ lastInsertRowId: number; changes: number }> => Promise.resolve({ lastInsertRowId: 1, changes: 0 })),
    runSync: vi.fn((): { lastInsertRowId: number; changes: number } => ({ lastInsertRowId: 1, changes: 0 })),
};

vi.mocked(SQLite.openDatabaseSync).mockReturnValue(sharedMockDb as any);

describe('OfflineQueueRepository', () => {
    let queue: OfflineQueueRepository;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(SQLite.openDatabaseSync).mockReturnValue(sharedMockDb as any);
        queue = new OfflineQueueRepository();
        // Clear after constructor init
        sharedMockDb.runSync.mockClear();
        sharedMockDb.getAllSync.mockClear();
    });

    describe('init', () => {
        it('constructor で sync_queue テーブルを作成すること', () => {
            sharedMockDb.execSync.mockClear();
            const _newQueue = new OfflineQueueRepository();

            expect(sharedMockDb.execSync).toHaveBeenCalled();
            const calls = sharedMockDb.execSync.mock.calls;
            const allSql = calls.map((c) => c[0] as string).join(' ');
            expect(allSql).toContain('CREATE TABLE IF NOT EXISTS sync_queue');
        });
    });

    describe('add', () => {
        it('INSERT クエリを実行すること', async () => {
            await queue.add({ table: 'todos', operation: 'INSERT', data: { id: 't1', title: 'Test' } });

            expect(sharedMockDb.runSync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO sync_queue'),
                expect.arrayContaining(['todos', 'INSERT'])
            );
        });

        it('data を JSON 文字列化して保存すること', async () => {
            const data = { id: 't1', title: 'Test Todo' };
            await queue.add({ table: 'todos', operation: 'INSERT', data });

            const insertCall = sharedMockDb.runSync.mock.calls.find((c) => (c[0] as string).includes('INSERT INTO sync_queue'));
            expect(insertCall).toBeDefined();
            const params = insertCall![1] as any[];
            // params: [id, tableName, operation, data, createdAt, retryCount]
            expect(params[3]).toBe(JSON.stringify(data));
        });

        it('retryCount を 0 で初期化すること', async () => {
            await queue.add({ table: 'categories', operation: 'UPDATE', data: {} });

            const insertCall = sharedMockDb.runSync.mock.calls.find((c) => (c[0] as string).includes('INSERT INTO sync_queue'));
            const params = insertCall![1] as any[];
            expect(params[5]).toBe(0);
        });
    });

    describe('getAll', () => {
        it('全キューアイテムを返すこと', async () => {
            sharedMockDb.getAllSync.mockReturnValueOnce([
                {
                    id: 'q1', tableName: 'todos', operation: 'INSERT',
                    data: '{"id":"t1"}', createdAt: '2025-01-01T00:00:00.000Z', retryCount: 0
                }
            ]);

            const items = await queue.getAll();
            expect(items).toHaveLength(1);
            expect(items[0].id).toBe('q1');
            expect(items[0].table).toBe('todos');
            expect(items[0].operation).toBe('INSERT');
            expect(items[0].data).toEqual({ id: 't1' });
            expect(items[0].createdAt).toBeInstanceOf(Date);
            expect(items[0].retryCount).toBe(0);
        });

        it('空のキューで空配列を返すこと', async () => {
            sharedMockDb.getAllSync.mockReturnValueOnce([]);
            const items = await queue.getAll();
            expect(items).toEqual([]);
        });

        it('ORDER BY createdAt ASC でクエリすること', async () => {
            sharedMockDb.getAllSync.mockReturnValueOnce([]);
            await queue.getAll();
            expect(sharedMockDb.getAllSync).toHaveBeenCalledWith(
                expect.stringContaining('ORDER BY createdAt ASC')
            );
        });
    });

    describe('remove', () => {
        it('指定 ID のアイテムを DELETE すること', async () => {
            await queue.remove('q1');
            expect(sharedMockDb.runSync).toHaveBeenCalledWith(
                'DELETE FROM sync_queue WHERE id = ?', ['q1']
            );
        });
    });

    describe('clear', () => {
        it('全アイテムを DELETE すること', async () => {
            await queue.clear();
            expect(sharedMockDb.runSync).toHaveBeenCalledWith('DELETE FROM sync_queue');
        });
    });

    describe('incrementRetry', () => {
        it('retryCount を +1 する UPDATE を実行すること', async () => {
            await queue.incrementRetry('q1');
            expect(sharedMockDb.runSync).toHaveBeenCalledWith(
                'UPDATE sync_queue SET retryCount = retryCount + 1 WHERE id = ?', ['q1']
            );
        });
    });
});
