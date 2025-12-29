import Dexie, { Table } from 'dexie';
import { Todo, Category, SRSProfile, Session } from '@pomarc/shared';
import { generateId } from '@/lib/utils';

export class PomArcDatabase extends Dexie {
    todos!: Table<Todo>;
    categories!: Table<Omit<Category, 'children'>>;
    srsProfiles!: Table<SRSProfile>;
    sessions!: Table<Session>;

    private currentUserId: string | null = null;

    setUserId(id: string | null) {
        this.currentUserId = id;
    }

    constructor() {
        super('PomArcDB_v2');

        // ... (stores configuration)
        this.version(3).stores({
            todos: 'id, dueDate, categoryId, completed, createdAt, updatedAt, srsGroupId',
            categories: 'id, parentId, order, createdAt, updatedAt',
            srsProfiles: 'id, isDefault, createdAt, updatedAt',
            sessions: 'id, todoId, createdAt'
        });

        // Setup hooks for realtime push
        this.setupHooks();

        // Populate with initial data
        this.on('populate', () => {
            this.populateInitialData();
        });
    }

    private setupHooks() {
        const tables = ['todos', 'categories', 'srsProfiles', 'sessions'];
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

        tables.forEach(tableName => {
            // @ts-ignore
            this[tableName].hook('creating', (primKey, obj, trans) => {
                // @ts-ignore
                if (trans.source === 'sync' || !this.currentUserId) return;

                // Trigger async push (with offline queue fallback)
                setTimeout(async () => {
                    const { supabase } = await import('./supabase');
                    const { mapper } = await import('./mapper');
                    const { offlineQueue, isOnline } = await import('./offlineQueue');

                    const mapped = mapper.toSupabase(obj, this.currentUserId!, allowedFieldsMap[tableName]);

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
                    const { mapper } = await import('./mapper');
                    const { offlineQueue, isOnline } = await import('./offlineQueue');

                    const mapped = mapper.toSupabase(updatedObj, this.currentUserId!, allowedFieldsMap[tableName]);

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

        // Initial Categories
        const rootId = generateId();
        const subId1 = generateId();
        const subId2 = generateId();

        await this.categories.bulkAdd([
            {
                id: rootId,
                name: '学習',
                level: 'large',
                order: 0,
                createdAt: now,
                updatedAt: now
            },
            {
                id: subId1,
                name: '数学',
                level: 'medium',
                parentId: rootId,
                order: 0,
                createdAt: now,
                updatedAt: now
            },
            {
                id: subId2,
                name: '英語',
                level: 'medium',
                parentId: rootId,
                order: 1,
                createdAt: now,
                updatedAt: now
            },
            {
                id: generateId(),
                name: '青チャート',
                level: 'small',
                parentId: subId1,
                order: 0,
                createdAt: now,
                updatedAt: now
            }
        ]);

        // Initial SRS Profiles
        await this.srsProfiles.bulkAdd([
            {
                id: generateId(),
                name: '忘却曲線 (標準)',
                intervals: [1, 3, 7, 14, 30],
                isDefault: true, // boolean
                createdAt: now,
                updatedAt: now
            },
            {
                id: generateId(),
                name: '短期集中',
                intervals: [1, 2, 3, 5],
                isDefault: false, // boolean
                createdAt: now,
                updatedAt: now
            }
        ]);
    }
}

export const db = new PomArcDatabase();
