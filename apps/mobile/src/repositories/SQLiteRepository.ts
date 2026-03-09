import { StorageInterface, Todo, Category, SRSProfile, Session, Feedback, generateId } from "@studytodo/shared";
import * as SQLite from 'expo-sqlite';

/**
 * モバイル(Expo)用のSQLiteリポジトリ実装。
 * StorageInterfaceを実装し、Web版(Dexie)と同様の操作を提供します。
 */
type ChangeData = Todo | Category | SRSProfile | Session | Feedback | { id: string } | Todo[];
type ChangeListener = (table: string, type: 'INSERT' | 'UPDATE' | 'DELETE', data: ChangeData) => void;

export class SQLiteRepository implements StorageInterface {
    private db: SQLite.SQLiteDatabase;
    private onChangeListeners: ChangeListener[] = [];

    constructor() {
        this.db = SQLite.openDatabaseSync('studytodo.db');
        this.init();
    }

    onDataChange(callback: ChangeListener): () => void {
        this.onChangeListeners.push(callback);
        return () => {
            const index = this.onChangeListeners.indexOf(callback);
            if (index > -1) {
                this.onChangeListeners.splice(index, 1);
            }
        };
    }

    private notifyChange(table: string, type: 'INSERT' | 'UPDATE' | 'DELETE', data: ChangeData) {
        this.onChangeListeners.forEach(listener => listener(table, type, data));
    }

    private init() {
        // Initialize Todos table
        this.db.execSync(`
            CREATE TABLE IF NOT EXISTS todos (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,     -- Added
                completed INTEGER DEFAULT 0,
                createdAt TEXT,
                updatedAt TEXT,
                dueDate TEXT,
                dueTime TEXT,         -- Added
                endTime TEXT,         -- Added
                categoryId TEXT,
                estimatedDuration INTEGER,
                actualDuration INTEGER,
                priority TEXT,
                notes TEXT,
                memo TEXT,
                range TEXT,
                srsInterval TEXT,
                tags TEXT,
                srsLevel INTEGER,
                nextReviewDate TEXT,
                srsProfileId TEXT,
                srsGroupId TEXT,     -- Added
                reviewHistory TEXT
            );
        `);

        // Migrations (Safe Mode) - using try/catch to ignore "duplicate column" errors
        const todoMigrations = ['memo', 'range', 'srsInterval', 'description', 'srsGroupId', 'dueTime', 'endTime'];
        todoMigrations.forEach(col => {
            try { this.db.execSync(`ALTER TABLE todos ADD COLUMN ${col} TEXT;`); } catch (e) { }
        });

        // Other tables
        this.db.execSync(`
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parentId TEXT,
                level TEXT,
                isDefault INTEGER,
                "order" INTEGER,
                color TEXT,
                icon TEXT,
                customIconUri TEXT,
                createdAt TEXT,
                updatedAt TEXT
            );
        `);

        const catMigrations = ['color', 'icon', 'customIconUri'];
        catMigrations.forEach(col => {
            try { this.db.execSync(`ALTER TABLE categories ADD COLUMN ${col} TEXT;`); } catch (e) { }
        });

        this.db.execSync(`
            CREATE TABLE IF NOT EXISTS srsProfiles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                intervals TEXT,
                isDefault INTEGER,
                createdAt TEXT,
                updatedAt TEXT
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                todoId TEXT,
                todoTitle TEXT,
                startTime TEXT,
                endTime TEXT,
                duration INTEGER,
                mode TEXT,
                createdAt TEXT
            );

            CREATE TABLE IF NOT EXISTS feedbacks (
                id TEXT PRIMARY KEY,
                userId TEXT,
                content TEXT,
                type TEXT,
                deviceInfo TEXT,
                version TEXT,
                createdAt TEXT
            );
        `);

        // Additional migrations...
        try { this.db.execSync(`ALTER TABLE todos ADD COLUMN estimatedDuration INTEGER;`); } catch (e) { }
        try { this.db.execSync(`ALTER TABLE todos ADD COLUMN actualDuration INTEGER;`); } catch (e) { }

        // デフォルトSRSプロファイルの投入（初回のみ）
        const existingProfiles = this.db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM srsProfiles');
        if (existingProfiles?.count === 0) {
            const now = new Date().toISOString();
            const id = generateId();
            this.db.runSync(
                `INSERT INTO srsProfiles (id, name, intervals, isDefault, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
                [id, '忘却曲線 (標準)', JSON.stringify([1, 3, 7, 14, 30]), 1, now, now]
            );
        }
    }

    // Helper to serialize/deserialize
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private toDB(obj: Record<string, any>): Record<string, any> {
        const row = { ...obj };
        if (typeof row.completed === 'boolean') row.completed = row.completed ? 1 : 0;
        if (typeof row.isDefault === 'boolean') row.isDefault = row.isDefault ? 1 : 0;
        // Date objects to ISO strings are handled by JSON.stringify usually, but here we expect objects with Date properties
        // We need to ensure Dates are stored as ISO strings
        ['createdAt', 'updatedAt', 'dueDate', 'nextReviewDate', 'startTime', 'endTime'].forEach(key => {
            if (row[key] instanceof Date) {
                if (!isNaN(row[key].getTime())) {
                    row[key] = row[key].toISOString();
                } else {
                    row[key] = null;
                }
            }
        });

        // JSON fields
        ['tags', 'reviewHistory', 'intervals'].forEach(key => {
            if (row[key] && typeof row[key] !== 'string') row[key] = JSON.stringify(row[key]);
        });

        return row;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private fromDB(row: Record<string, any> | null): any {
        if (!row) return undefined;
        const obj = { ...row };
        obj.completed = !!obj.completed;
        obj.isDefault = !!obj.isDefault;

        // Convert ISO date strings to Date objects
        // Note: dueTime and endTime in Todos are "HH:mm" format strings, NOT dates
        // But in Sessions table, startTime and endTime are ISO date strings
        // We detect ISO format by checking if the string contains 'T' and is > 10 chars
        ['createdAt', 'updatedAt', 'dueDate', 'nextReviewDate', 'startTime', 'endTime'].forEach(key => {
            if (obj[key] && typeof obj[key] === 'string') {
                // Only parse as Date if it looks like an ISO string (has 'T' and is longer than "HH:mm")
                // This preserves "HH:mm" strings for Todo.dueTime and Todo.endTime
                if (obj[key].includes('T') || obj[key].length > 10) {
                    const d = new Date(obj[key]);
                    obj[key] = !isNaN(d.getTime()) ? d : undefined;
                }
                // If it's a short string like "11:00", leave it as-is
            }
        });

        ['tags', 'reviewHistory', 'intervals'].forEach(key => {
            if (obj[key]) {
                try {
                    obj[key] = JSON.parse(obj[key]);
                } catch (e) {
                    obj[key] = [];
                }
            }
        });
        return obj;
    }

    // Todos
    async getTodos(): Promise<Todo[]> {
        const rows = await this.db.getAllAsync('SELECT * FROM todos');
        return rows.map(r => this.fromDB(r));
    }

    async getTodo(id: string): Promise<Todo | undefined> {
        const row = await this.db.getFirstAsync('SELECT * FROM todos WHERE id = ?', [id]);
        return this.fromDB(row);
    }

    async addTodo(todo: Todo): Promise<void> {
        const row = this.toDB(todo);
        await this.db.runAsync(
            `INSERT INTO todos (id, title, completed, createdAt, updatedAt, dueDate, dueTime, endTime, categoryId, estimatedDuration, actualDuration, priority, notes, memo, range, srsInterval, tags, srsLevel, nextReviewDate, srsProfileId, srsGroupId, reviewHistory)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [row.id, row.title, row.completed, row.createdAt, row.updatedAt, row.dueDate, row.dueTime, row.endTime, row.categoryId, row.estimatedDuration, row.actualDuration, row.priority, row.notes, row.memo, row.range, row.srsInterval, row.tags, row.srsLevel, row.nextReviewDate, row.srsProfileId, row.srsGroupId, row.reviewHistory]
        );
        this.notifyChange('todos', 'INSERT', todo);
    }

    async updateTodo(id: string, updates: Partial<Todo>): Promise<void> {
        // Construct dynamic UPDATE query
        const row = this.toDB(updates);

        // Allowed columns in local DB
        const allowedColumns = [
            'title', 'description', 'completed', 'createdAt', 'updatedAt',
            'dueDate', 'dueTime', 'endTime', 'categoryId', 'estimatedDuration', 'actualDuration',
            'priority', 'notes', 'memo', 'range', 'srsInterval', 'tags',
            'srsLevel', 'nextReviewDate', 'srsProfileId', 'srsGroupId', 'reviewHistory'
        ];

        const keys = Object.keys(row).filter(k => k !== 'id' && allowedColumns.includes(k));
        if (keys.length === 0) return;

        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => row[k]);

        await this.db.runAsync(`UPDATE todos SET ${setClause} WHERE id = ?`, [...values, id]);

        // Fetch full updated item for notification
        const updated = await this.getTodo(id);
        if (updated) this.notifyChange('todos', 'UPDATE', updated);
    }

    async deleteTodo(id: string): Promise<void> {
        // SRS Cascade Delete Check
        const todo = await this.getTodo(id);
        const idsToDelete: string[] = [id];

        if (todo && todo.srsGroupId && todo.srsGroupId === id) {
            // This is the Root SRS Todo -> Cascade Delete Children
            const children = await this.db.getAllAsync('SELECT id FROM todos WHERE srsGroupId = ?', [id]);
            children.forEach((c: { id: string }) => {
                if (c.id !== id) idsToDelete.push(c.id);
            });
        }

        if (idsToDelete.length === 1) {
            await this.db.runAsync('DELETE FROM todos WHERE id = ?', [id]);
        } else {
            const placeholders = idsToDelete.map(() => '?').join(', ');
            await this.db.runAsync(`DELETE FROM todos WHERE id IN (${placeholders})`, idsToDelete);
        }

        idsToDelete.forEach(deletedId => {
            this.notifyChange('todos', 'DELETE', { id: deletedId });
        });
    }

    async deleteTodosByGroupId(groupId: string): Promise<void> {
        if (!groupId) return;

        // Find all todos in the group first to notify changes later
        const todosToDelete = await this.db.getAllAsync('SELECT id FROM todos WHERE srsGroupId = ?', [groupId]);
        if (todosToDelete.length === 0) return;

        // Perform deletion
        await this.db.runAsync('DELETE FROM todos WHERE srsGroupId = ?', [groupId]);

        // Notify deletions
        todosToDelete.forEach((t: { id: string }) => {
            this.notifyChange('todos', 'DELETE', { id: t.id });
        });
    }

    /**
     * SRSプロファイルに基づいて、複数のTodo(復習)を一括生成・保存します。
     */
    async addSRSTodos(todos: Todo[]): Promise<void> {
        for (const todo of todos) {
            const row = this.toDB(todo);
            await this.db.runAsync(
                `INSERT INTO todos (id, title, completed, createdAt, updatedAt, dueDate, dueTime, endTime, categoryId, estimatedDuration, actualDuration, priority, notes, memo, range, srsInterval, tags, srsLevel, nextReviewDate, srsProfileId, srsGroupId, reviewHistory)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [row.id, row.title, row.completed, row.createdAt, row.updatedAt, row.dueDate, row.dueTime, row.endTime, row.categoryId, row.estimatedDuration, row.actualDuration, row.priority, row.notes, row.memo, row.range, row.srsInterval, row.tags, row.srsLevel, row.nextReviewDate, row.srsProfileId, row.srsGroupId, row.reviewHistory]
            );
        }
        // Notify once with all items to trigger batch sync
        if (todos.length > 0) {
            this.notifyChange('todos', 'INSERT', todos);
        }
    }

    // Categories
    async getCategories(): Promise<Category[]> {
        const rows = await this.db.getAllAsync('SELECT * FROM categories');
        return rows.map(r => this.fromDB(r));
    }

    async addCategory(category: Category): Promise<void> {
        const row = this.toDB(category);
        await this.db.runAsync(
            `INSERT INTO categories (id, name, parentId, level, isDefault, "order", color, icon, customIconUri, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [row.id, row.name, row.parentId, row.level, row.isDefault, row.order, row.color, row.icon, row.customIconUri, row.createdAt, row.updatedAt]
        );
        this.notifyChange('categories', 'INSERT', category);
    }

    async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
        const row = this.toDB(updates);
        // childrenプロパティはSQLには保存せず、メモリ上で再構築するため除外します
        const keys = Object.keys(row).filter(k => k !== 'id' && k !== 'children');
        if (keys.length === 0) return;

        const setClause = keys.map(k => `"${k}" = ?`).join(', '); // quote keys for "order"
        const values = keys.map(k => row[k]);

        await this.db.runAsync(`UPDATE categories SET ${setClause} WHERE id = ?`, [...values, id]);

        // Notify change with updated record
        const rows = await this.db.getAllAsync('SELECT * FROM categories WHERE id = ?', [id]);
        if (rows.length > 0) this.notifyChange('categories', 'UPDATE', this.fromDB(rows[0]));
    }

    async deleteCategory(id: string): Promise<void> {
        await this.db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
        this.notifyChange('categories', 'DELETE', { id });
    }

    // SRS Profiles
    async getSRSProfiles(): Promise<SRSProfile[]> {
        const rows = await this.db.getAllAsync('SELECT * FROM srsProfiles');
        return rows.map(r => this.fromDB(r));
    }

    async addSRSProfile(profile: SRSProfile): Promise<void> {
        const row = this.toDB(profile);
        await this.db.runAsync(
            `INSERT INTO srsProfiles (id, name, intervals, isDefault, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [row.id, row.name, row.intervals, row.isDefault, row.createdAt, row.updatedAt]
        );
        this.notifyChange('srs_profiles', 'INSERT', profile);
    }

    async updateSRSProfile(id: string, updates: Partial<SRSProfile>): Promise<void> {
        const row = this.toDB(updates);
        const keys = Object.keys(row).filter(k => k !== 'id');
        if (keys.length === 0) return;

        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => row[k]);

        await this.db.runAsync(`UPDATE srsProfiles SET ${setClause} WHERE id = ?`, [...values, id]);

        const rows = await this.db.getAllAsync('SELECT * FROM srsProfiles WHERE id = ?', [id]);
        if (rows.length > 0) this.notifyChange('srs_profiles', 'UPDATE', this.fromDB(rows[0]));
    }

    async deleteSRSProfile(id: string): Promise<void> {
        await this.db.runAsync('DELETE FROM srsProfiles WHERE id = ?', [id]);
        this.notifyChange('srs_profiles', 'DELETE', { id });
    }

    // Sessions
    async addSession(session: Session): Promise<void> {
        const row = this.toDB(session);
        await this.db.runAsync(
            `INSERT INTO sessions (id, todoId, todoTitle, startTime, endTime, duration, mode, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [row.id, row.todoId, row.todoTitle, row.startTime, row.endTime, row.duration, row.mode, row.createdAt]
        );
        this.notifyChange('sessions', 'INSERT', session);
    }

    async getSessions(): Promise<Session[]> {
        const rows = await this.db.getAllAsync('SELECT * FROM sessions');
        return rows.map(r => this.fromDB(r));
    }

    // Feedback
    async clearAll(): Promise<void> {
        await this.db.runAsync('DELETE FROM todos');
        await this.db.runAsync('DELETE FROM categories');
        await this.db.runAsync('DELETE FROM srsProfiles');
        await this.db.runAsync('DELETE FROM sessions');
        await this.db.runAsync('DELETE FROM feedbacks');
    }

    async addFeedback(feedback: Feedback): Promise<void> {
        const row = this.toDB(feedback);
        await this.db.runAsync(
            `INSERT INTO feedbacks (id, userId, content, type, deviceInfo, version, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [row.id, row.userId, row.content, row.type, row.deviceInfo, row.version, row.createdAt]
        );
        this.notifyChange('feedbacks', 'INSERT', feedback);
    }
}
