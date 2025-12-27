import { StorageInterface, Todo, Category, SRSProfile, Session } from "@pomarc/shared";
import * as SQLite from 'expo-sqlite';

/**
 * モバイル(Expo)用のSQLiteリポジトリ実装。
 * StorageInterfaceを実装し、Web版(Dexie)と同様の操作を提供します。
 */
export class SQLiteRepository implements StorageInterface {
    private db: SQLite.SQLiteDatabase;

    constructor() {
        this.db = SQLite.openDatabaseSync('pomarc.db');
        this.init();
    }

    private init() {
        // Initialize Todos table
        this.db.execSync(`
            CREATE TABLE IF NOT EXISTS todos (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                completed INTEGER DEFAULT 0,
                createdAt TEXT,
                updatedAt TEXT,
                dueDate TEXT,
                categoryId TEXT,
                estimatedDuration INTEGER,
                actualDuration INTEGER,
                priority TEXT,
                notes TEXT,
                memo TEXT,          -- Added for Web Parity
                range TEXT,         -- Added for Web Parity
                srsInterval TEXT,   -- Added for Web Parity
                tags TEXT, -- JSON array
                srsLevel INTEGER,
                nextReviewDate TEXT,
                srsProfileId TEXT,
                reviewHistory TEXT -- JSON array
            );
        `);

        // Migrations (Safe Mode)
        try { this.db.execSync('ALTER TABLE todos ADD COLUMN memo TEXT;'); } catch (e) { }
        try { this.db.execSync('ALTER TABLE todos ADD COLUMN range TEXT;'); } catch (e) { }
        try { this.db.execSync('ALTER TABLE todos ADD COLUMN srsInterval TEXT;'); } catch (e) { }

        // Other tables
        this.db.execSync(`
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parentId TEXT,
                level TEXT,
                isDefault INTEGER,
                "order" INTEGER,
                createdAt TEXT,
                updatedAt TEXT
            );

            CREATE TABLE IF NOT EXISTS srsProfiles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                intervals TEXT, -- JSON array
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
        `);
    }

    // Helper to serialize/deserialize
    private toDB(obj: any): any {
        const row = { ...obj };
        if (typeof row.completed === 'boolean') row.completed = row.completed ? 1 : 0;
        if (typeof row.isDefault === 'boolean') row.isDefault = row.isDefault ? 1 : 0;
        // Date objects to ISO strings are handled by JSON.stringify usually, but here we expect objects with Date properties
        // We need to ensure Dates are stored as ISO strings
        ['createdAt', 'updatedAt', 'dueDate', 'nextReviewDate', 'startTime', 'endTime'].forEach(key => {
            if (row[key] instanceof Date) row[key] = row[key].toISOString();
        });

        // JSON fields
        ['tags', 'reviewHistory', 'intervals'].forEach(key => {
            if (row[key] && typeof row[key] !== 'string') row[key] = JSON.stringify(row[key]);
        });

        return row;
    }

    private fromDB(row: any): any {
        if (!row) return undefined;
        const obj = { ...row };
        obj.completed = !!obj.completed;
        obj.isDefault = !!obj.isDefault;

        ['createdAt', 'updatedAt', 'dueDate', 'nextReviewDate', 'startTime', 'endTime'].forEach(key => {
            if (obj[key]) obj[key] = new Date(obj[key]);
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
            `INSERT INTO todos (id, title, completed, createdAt, updatedAt, dueDate, categoryId, estimatedDuration, actualDuration, priority, notes, memo, range, srsInterval, tags, srsLevel, nextReviewDate, srsProfileId, reviewHistory)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [row.id, row.title, row.completed, row.createdAt, row.updatedAt, row.dueDate, row.categoryId, row.estimatedDuration, row.actualDuration, row.priority, row.notes, row.memo, row.range, row.srsInterval, row.tags, row.srsLevel, row.nextReviewDate, row.srsProfileId, row.reviewHistory]
        );
    }

    async updateTodo(id: string, updates: Partial<Todo>): Promise<void> {
        // Construct dynamic UPDATE query
        const row = this.toDB(updates);
        const keys = Object.keys(row).filter(k => k !== 'id');
        if (keys.length === 0) return;

        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => row[k]);

        await this.db.runAsync(`UPDATE todos SET ${setClause} WHERE id = ?`, [...values, id]);
    }

    async deleteTodo(id: string): Promise<void> {
        await this.db.runAsync('DELETE FROM todos WHERE id = ?', [id]);
    }

    // Categories
    async getCategories(): Promise<Category[]> {
        const rows = await this.db.getAllAsync('SELECT * FROM categories');
        return rows.map(r => this.fromDB(r));
    }

    async addCategory(category: Category): Promise<void> {
        const row = this.toDB(category);
        await this.db.runAsync(
            `INSERT INTO categories (id, name, parentId, level, isDefault, "order", createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [row.id, row.name, row.parentId, row.level, row.isDefault, row.order, row.createdAt, row.updatedAt] // quote order
        );
    }

    async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
        const row = this.toDB(updates);
        // childrenプロパティはSQLには保存せず、メモリ上で再構築するため除外します
        const keys = Object.keys(row).filter(k => k !== 'id' && k !== 'children');
        if (keys.length === 0) return;

        const setClause = keys.map(k => `"${k}" = ?`).join(', '); // quote keys for "order"
        const values = keys.map(k => row[k]);

        await this.db.runAsync(`UPDATE categories SET ${setClause} WHERE id = ?`, [...values, id]);
    }

    async deleteCategory(id: string): Promise<void> {
        await this.db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
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
    }

    async updateSRSProfile(id: string, updates: Partial<SRSProfile>): Promise<void> {
        const row = this.toDB(updates);
        const keys = Object.keys(row).filter(k => k !== 'id');
        if (keys.length === 0) return;

        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => row[k]);

        await this.db.runAsync(`UPDATE srsProfiles SET ${setClause} WHERE id = ?`, [...values, id]);
    }

    async deleteSRSProfile(id: string): Promise<void> {
        await this.db.runAsync('DELETE FROM srsProfiles WHERE id = ?', [id]);
    }

    // Sessions
    async addSession(session: Session): Promise<void> {
        const row = this.toDB(session);
        await this.db.runAsync(
            `INSERT INTO sessions (id, todoId, todoTitle, startTime, endTime, duration, mode, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [row.id, row.todoId, row.todoTitle, row.startTime, row.endTime, row.duration, row.mode, row.createdAt]
        );
    }

    async getSessions(): Promise<Session[]> {
        const rows = await this.db.getAllAsync('SELECT * FROM sessions');
        return rows.map(r => this.fromDB(r));
    }
}
