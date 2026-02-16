import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processTableSync, SyncItem, SyncHandlers } from '../syncCore';

describe('processTableSync', () => {
    let handlers: SyncHandlers<SyncItem>;

    beforeEach(() => {
        handlers = {
            onImport: vi.fn().mockResolvedValue(undefined),
            onUpdate: vi.fn().mockResolvedValue(undefined),
            onExport: vi.fn().mockResolvedValue(undefined)
        };
    });

    it('クラウドにのみ存在するアイテムを import する', async () => {
        const localItems: SyncItem[] = [];
        const cloudItems: SyncItem[] = [
            { id: '1', updatedAt: '2025-01-01T10:00:00.000Z' }
        ];

        const result = await processTableSync(localItems, cloudItems, handlers);

        expect(handlers.onImport).toHaveBeenCalledTimes(1);
        expect(handlers.onImport).toHaveBeenCalledWith(cloudItems[0]);
        expect(result.imported).toBe(1);
        expect(result.updated).toBe(0);
        expect(result.exported).toBe(0);
    });

    it('ローカルにのみ存在するアイテムを export する', async () => {
        const localItems: SyncItem[] = [
            { id: '1', updatedAt: '2025-01-01T10:00:00.000Z' }
        ];
        const cloudItems: SyncItem[] = [];

        const result = await processTableSync(localItems, cloudItems, handlers);

        expect(handlers.onExport).toHaveBeenCalledTimes(1);
        expect(handlers.onExport).toHaveBeenCalledWith([localItems[0]]);
        expect(result.imported).toBe(0);
        expect(result.updated).toBe(0);
        expect(result.exported).toBe(1);
    });

    it('クラウドが新しい場合にローカルを update する', async () => {
        const localItems: SyncItem[] = [
            { id: '1', updatedAt: '2025-01-01T10:00:00.000Z' }
        ];
        const cloudItems: SyncItem[] = [
            { id: '1', updatedAt: '2025-01-02T10:00:00.000Z' } // 1日後
        ];

        const result = await processTableSync(localItems, cloudItems, handlers);

        expect(handlers.onUpdate).toHaveBeenCalledTimes(1);
        expect(handlers.onUpdate).toHaveBeenCalledWith('1', cloudItems[0]);
        expect(result.imported).toBe(0);
        expect(result.updated).toBe(1);
        expect(result.exported).toBe(0);
    });

    it('ローカルが新しい場合に export する', async () => {
        const localItems: SyncItem[] = [
            { id: '1', updatedAt: '2025-01-02T10:00:00.000Z' } // 1日後
        ];
        const cloudItems: SyncItem[] = [
            { id: '1', updatedAt: '2025-01-01T10:00:00.000Z' }
        ];

        const result = await processTableSync(localItems, cloudItems, handlers);

        expect(handlers.onExport).toHaveBeenCalledTimes(1);
        expect(handlers.onExport).toHaveBeenCalledWith([localItems[0]]);
        expect(result.imported).toBe(0);
        expect(result.updated).toBe(0);
        expect(result.exported).toBe(1);
    });

    it('同じ updatedAt の場合は何もしない', async () => {
        const localItems: SyncItem[] = [
            { id: '1', updatedAt: '2025-01-01T10:00:00.000Z' }
        ];
        const cloudItems: SyncItem[] = [
            { id: '1', updatedAt: '2025-01-01T10:00:00.000Z' }
        ];

        const result = await processTableSync(localItems, cloudItems, handlers);

        expect(handlers.onImport).not.toHaveBeenCalled();
        expect(handlers.onUpdate).not.toHaveBeenCalled();
        expect(handlers.onExport).not.toHaveBeenCalled();
        expect(result.imported).toBe(0);
        expect(result.updated).toBe(0);
        expect(result.exported).toBe(0);
    });

    it('複数のアイテムを正しく処理する', async () => {
        const localItems: SyncItem[] = [
            { id: '1', updatedAt: '2025-01-01T10:00:00.000Z' }, // クラウドと同じ
            { id: '2', updatedAt: '2025-01-02T10:00:00.000Z' }, // ローカルが新しい
            { id: '3', updatedAt: '2025-01-01T10:00:00.000Z' }, // クラウドにない
        ];
        const cloudItems: SyncItem[] = [
            { id: '1', updatedAt: '2025-01-01T10:00:00.000Z' }, // ローカルと同じ
            { id: '2', updatedAt: '2025-01-01T10:00:00.000Z' }, // クラウドが古い
            { id: '4', updatedAt: '2025-01-01T10:00:00.000Z' }, // ローカルにない
        ];

        const result = await processTableSync(localItems, cloudItems, handlers);

        expect(handlers.onImport).toHaveBeenCalledTimes(1); // id: 4
        expect(handlers.onExport).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ id: '2' }),
            expect.objectContaining({ id: '3' })
        ]));
        expect(result.imported).toBe(1);
        expect(result.updated).toBe(0);
        expect(result.exported).toBe(2);
    });

    it('Date オブジェクトでも正しく比較する', async () => {
        const localItems: SyncItem[] = [
            { id: '1', updatedAt: new Date('2025-01-01T10:00:00.000Z') }
        ];
        const cloudItems: SyncItem[] = [
            { id: '1', updatedAt: new Date('2025-01-02T10:00:00.000Z') }
        ];

        const result = await processTableSync(localItems, cloudItems, handlers);

        expect(handlers.onUpdate).toHaveBeenCalledTimes(1);
        expect(result.updated).toBe(1);
    });

    it('updatedAt が undefined でも動作する', async () => {
        const localItems: SyncItem[] = [
            { id: '1' } // updatedAt なし
        ];
        const cloudItems: SyncItem[] = [
            { id: '1', updatedAt: '2025-01-01T10:00:00.000Z' }
        ];

        const result = await processTableSync(localItems, cloudItems, handlers);

        // クラウドの方が新しいとみなされる
        expect(handlers.onUpdate).toHaveBeenCalledTimes(1);
        expect(result.updated).toBe(1);
    });

    it('空のリストでも動作する', async () => {
        const result = await processTableSync([], [], handlers);

        expect(handlers.onImport).not.toHaveBeenCalled();
        expect(handlers.onUpdate).not.toHaveBeenCalled();
        expect(handlers.onExport).not.toHaveBeenCalled();
        expect(result).toEqual({ imported: 0, updated: 0, exported: 0 });
    });

    it('onImport がエラーをスローした場合に例外が伝播する', async () => {
        handlers.onImport = vi.fn().mockRejectedValue(new Error('Import failed'));
        const cloudItems: SyncItem[] = [{ id: '1', updatedAt: '2025-01-01T10:00:00.000Z' }];

        await expect(processTableSync([], cloudItems, handlers)).rejects.toThrow('Import failed');
    });

    it('onExport がエラーをスローした場合に例外が伝播する', async () => {
        handlers.onExport = vi.fn().mockRejectedValue(new Error('Export failed'));
        const localItems: SyncItem[] = [{ id: '1', updatedAt: '2025-01-01T10:00:00.000Z' }];

        await expect(processTableSync(localItems, [], handlers)).rejects.toThrow('Export failed');
    });

    it('大量アイテム（100件）を正しく処理する', async () => {
        const localItems: SyncItem[] = Array.from({ length: 50 }, (_, i) => ({
            id: `local-${i}`,
            updatedAt: '2025-01-01T10:00:00.000Z'
        }));
        const cloudItems: SyncItem[] = Array.from({ length: 50 }, (_, i) => ({
            id: `cloud-${i}`,
            updatedAt: '2025-01-01T10:00:00.000Z'
        }));

        const result = await processTableSync(localItems, cloudItems, handlers);

        expect(result.imported).toBe(50);
        expect(result.exported).toBe(50);
        expect(result.updated).toBe(0);
    });
});
