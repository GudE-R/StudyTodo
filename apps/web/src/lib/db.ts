import Dexie, { Table } from 'dexie';
import { Todo, Category, SRSProfile, Session, Feedback, mapper, allowedFieldsMap, supabaseTableMap } from '@pomarc/shared';
import { generateId } from '@/lib/utils';

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

        // ... (stores configuration)
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

    private setupHooks() {
        const tables = ['todos', 'categories', 'srsProfiles', 'sessions', 'feedbacks'];
        // supabaseTableMap と allowedFieldsMap は @pomarc/shared からインポート

        tables.forEach(tableName => {
            // @ts-ignore
            this[tableName].hook('creating', (primKey, obj, trans) => {
                // @ts-ignore
                if (trans.source === 'sync' || !this.currentUserId) return;

                // Trigger async push (with offline queue fallback)
                setTimeout(async () => {
                    const { supabase } = await import('./supabase');
                    const { offlineQueue, isOnline } = await import('./offlineQueue');

                    const mapped = mapper.toSupabase(obj as Record<string, unknown>, this.currentUserId!, allowedFieldsMap[tableName]);

                    if (!isOnline()) {
                        await offlineQueue.add({ table: tableName, operation: 'INSERT', data: obj });
                        return;
                    }

                    const { error } = await supabase.from(supabaseTableMap[tableName]).upsert(mapped);
                    if (error) {
                        console.warn('[db.ts] Push failed, adding to offline queue:', error.message);
                        await offlineQueue.add({ table: tableName, operation: 'INSERT', data: obj });
                    }
                }, 0);
            });

            // @ts-ignore
            this[tableName].hook('updating', (mods, primKey, obj, trans) => {
                // @ts-ignore
                if (trans.source === 'sync' || !this.currentUserId) return;

                const updatedObj = { ...obj, ...mods };
                setTimeout(async () => {
                    const { supabase } = await import('./supabase');
                    const { offlineQueue, isOnline } = await import('./offlineQueue');

                    const mapped = mapper.toSupabase(updatedObj as Record<string, unknown>, this.currentUserId!, allowedFieldsMap[tableName]);

                    if (!isOnline()) {
                        await offlineQueue.add({ table: tableName, operation: 'UPDATE', data: updatedObj });
                        return;
                    }

                    const { error } = await supabase.from(supabaseTableMap[tableName]).upsert(mapped);
                    if (error) {
                        console.warn('[db.ts] Push failed, adding to offline queue:', error.message);
                        await offlineQueue.add({ table: tableName, operation: 'UPDATE', data: updatedObj });
                    }
                }, 0);
            });

            // @ts-ignore
            this[tableName].hook('deleting', (primKey, obj, trans) => {
                // @ts-ignore
                if (trans.source === 'sync' || !this.currentUserId) return;

                setTimeout(async () => {
                    const { supabase } = await import('./supabase');
                    const { offlineQueue, isOnline } = await import('./offlineQueue');

                    if (!isOnline()) {
                        await offlineQueue.add({ table: tableName, operation: 'DELETE', data: { id: primKey } });
                        return;
                    }

                    const { error } = await supabase.from(supabaseTableMap[tableName]).delete().eq('id', primKey);
                    if (error) {
                        console.warn('[db.ts] Delete failed, adding to offline queue:', error.message);
                        await offlineQueue.add({ table: tableName, operation: 'DELETE', data: { id: primKey } });
                    }
                }, 0);
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
