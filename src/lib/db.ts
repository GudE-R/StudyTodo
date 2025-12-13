import Dexie, { Table } from 'dexie';
import { Todo, Category, SRSProfile, Session } from '@/types';
import { generateId } from '@/lib/utils';

export class PomArcDatabase extends Dexie {
    todos!: Table<Todo>;
    categories!: Table<Category>;
    srsProfiles!: Table<SRSProfile>;
    sessions!: Table<Session>;

    constructor() {
        super('PomArcDB_v2');

        // Version 2
        this.version(2).stores({
            todos: 'id, dueDate, categoryId, completed, createdAt, updatedAt',
            categories: 'id, parentId, order, createdAt, updatedAt',
            srsProfiles: 'id, isDefault, createdAt, updatedAt',
            sessions: 'id, todoId, createdAt'
        });

        // Version 3: Added srsGroupId index
        this.version(3).stores({
            todos: 'id, dueDate, categoryId, completed, createdAt, updatedAt, srsGroupId',
            categories: 'id, parentId, order, createdAt, updatedAt',
            srsProfiles: 'id, isDefault, createdAt, updatedAt',
            sessions: 'id, todoId, createdAt'
        });

        // Populate with initial data
        this.on('populate', () => {
            this.populateInitialData();
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
