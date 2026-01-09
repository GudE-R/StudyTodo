import Dexie, { Table, Transaction } from 'dexie';
import { Todo, Category, SRSProfile, Session, Feedback, mapper, allowedFieldsMap, supabaseTableMap, SyncOperationType } from '@pomarc/shared';
import { generateId } from '@/lib/utils';

/**
 * Extended transaction interface with sync source marker
 */
interface ExtendedTransaction extends Transaction {
    source?: 'sync';
}

/**
 * Table name type for type-safe dynamic access
 */
type TableName = 'todos' | 'categories' | 'srsProfiles' | 'sessions' | 'feedbacks';

export class PomArcDatabase extends Dexie {
    todos!: Table<Todo>;
    categories!: Table<Omit<Category, 'children'>>;
    srsProfiles!: Table<SRSProfile>;
    sessions!: Table<Session>;
    feedbacks!: Table<Feedback>;

    private currentUserId: string | null = null;

    setUserId(id: string | null) {
        this.currentUserId = id;
    }

    constructor() {
        super('PomArcDB_v2');

        this.version(4).stores({
            todos: 'id, dueDate, categoryId, completed, createdAt, updatedAt, srsGroupId',
            categories: 'id, parentId, order, createdAt, updatedAt',
            srsProfiles: 'id, isDefault, createdAt, updatedAt',
            sessions: 'id, todoId, createdAt',
            feedbacks: 'id, createdAt, type'
        });

        // Setup hooks for realtime push
        this.setupHooks();

        // Populate with initial data
        this.on('populate', () => {
            this.populateInitialData();
        });
    }

    /**
     * Push data to cloud with retry logic
     */
    private async pushToCloud(
        operation: SyncOperationType,
        tableName: string,
        data: Record<string, unknown>
    ): Promise<void> {
        if (!this.currentUserId) return;

        const { supabase } = await import('./supabase');
        const { offlineQueue, isOnline } = await import('./offlineQueue');

        const supabaseTable = supabaseTableMap[tableName] || tableName;
        const mapped = mapper.toSupabase(data, this.currentUserId, allowedFieldsMap[tableName]);

        if (!isOnline()) {
            await offlineQueue.add({ table: tableName, operation, data });
            return;
        }

        try {
            if (operation === 'DELETE') {
                const { error } = await supabase.from(supabaseTable).delete().eq('id', data.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from(supabaseTable).upsert(mapped);
                if (error) throw error;
            }
        } catch (error) {
            console.warn(`[db.ts] ${operation} failed, adding to offline queue:`, error);
            await offlineQueue.add({ table: tableName, operation, data });
        }
    }

    private setupHooks() {
        const tables: TableName[] = ['todos', 'categories', 'srsProfiles', 'sessions', 'feedbacks'];

        tables.forEach((tableName) => {
            const table = this[tableName] as Table;

            table.hook('creating', (_primKey, obj, trans) => {
                const extTrans = trans as ExtendedTransaction;
                if (extTrans.source === 'sync' || !this.currentUserId) return;

                // Use queueMicrotask for more reliable async execution than setTimeout
                queueMicrotask(() => {
                    this.pushToCloud('INSERT', tableName, obj as Record<string, unknown>);
                });
            });

            table.hook('updating', (mods, _primKey, obj, trans) => {
                const extTrans = trans as ExtendedTransaction;
                if (extTrans.source === 'sync' || !this.currentUserId) return;

                const updatedObj = { ...obj, ...mods };
                queueMicrotask(() => {
                    this.pushToCloud('UPDATE', tableName, updatedObj as Record<string, unknown>);
                });
            });

            table.hook('deleting', (primKey, _obj, trans) => {
                const extTrans = trans as ExtendedTransaction;
                if (extTrans.source === 'sync' || !this.currentUserId) return;

                queueMicrotask(() => {
                    this.pushToCloud('DELETE', tableName, { id: primKey });
                });
            });
        });
    }

    async populateInitialData() {
        const now = new Date();

        // Initial Categories (サンプル階層)
        const largeId = generateId();
        const mediumId = generateId();
        const smallId = generateId();

        await this.categories.bulkAdd([
            {
                id: largeId,
                name: '大カテゴリサンプル',
                level: 'large',
                order: 0,
                createdAt: now,
                updatedAt: now
            },
            {
                id: mediumId,
                name: '中カテゴリサンプル',
                level: 'medium',
                parentId: largeId,
                order: 0,
                createdAt: now,
                updatedAt: now
            },
            {
                id: smallId,
                name: '小カテゴリサンプル',
                level: 'small',
                parentId: mediumId,
                order: 0,
                createdAt: now,
                updatedAt: now
            }
        ]);

        // Initial SRS Profiles (忘却曲線のみ)
        await this.srsProfiles.bulkAdd([
            {
                id: generateId(),
                name: '忘却曲線 (標準)',
                intervals: [1, 3, 7, 14, 30],
                isDefault: true,
                createdAt: now,
                updatedAt: now
            }
        ]);
    }
}

export const db = new PomArcDatabase();
