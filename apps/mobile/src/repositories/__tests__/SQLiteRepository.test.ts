import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import * as SQLite from 'expo-sqlite';
import { SQLiteRepository } from '../SQLiteRepository';

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

describe('SQLiteRepository', () => {
    let repo: SQLiteRepository;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(SQLite.openDatabaseSync).mockReturnValue(sharedMockDb as any);
        repo = new SQLiteRepository();
        // Clear after constructor init, keep openDatabaseSync mock intact
        sharedMockDb.runAsync.mockClear();
        sharedMockDb.getAllAsync.mockClear();
        sharedMockDb.getFirstAsync.mockClear();
        sharedMockDb.getAllSync.mockClear();
        sharedMockDb.runSync.mockClear();
    });

    // ============================================================
    // init()
    // ============================================================
    describe('init', () => {
        it('constructor 内で execSync を呼んでテーブルを作成すること', () => {
            sharedMockDb.execSync.mockClear();
            const _newRepo = new SQLiteRepository();

            expect(sharedMockDb.execSync).toHaveBeenCalled();
            const calls = sharedMockDb.execSync.mock.calls;
            const allSql = calls.map((c) => c[0] as string).join(' ');
            expect(allSql).toContain('CREATE TABLE IF NOT EXISTS todos');
            expect(allSql).toContain('CREATE TABLE IF NOT EXISTS categories');
            expect(allSql).toContain('CREATE TABLE IF NOT EXISTS srsProfiles');
            expect(allSql).toContain('CREATE TABLE IF NOT EXISTS sessions');
            expect(allSql).toContain('CREATE TABLE IF NOT EXISTS feedbacks');
        });
    });

    // ============================================================
    // toDB / fromDB (serialization)
    // ============================================================
    describe('toDB / fromDB (serialization round-trip)', () => {
        it('boolean completed → 0/1 に変換すること', async () => {
            const todo = {
                id: 'test-1', title: 'Test Todo', completed: true,
                createdAt: new Date('2025-01-01T00:00:00Z'), updatedAt: new Date('2025-01-01T00:00:00Z'),
            };
            await repo.addTodo(todo as any);

            const insertCall = sharedMockDb.runAsync.mock.calls.find((c) => (c[0] as string).includes('INSERT INTO todos'));
            expect(insertCall).toBeDefined();
            const params = insertCall![1] as any[];
            expect(params[2]).toBe(1); // completed
        });

        it('Date オブジェクトを ISO 文字列に変換すること', async () => {
            const date = new Date('2025-06-15T10:30:00Z');
            const todo = { id: 'test-2', title: 'Date Test', completed: false, createdAt: date, updatedAt: date, dueDate: date };
            await repo.addTodo(todo as any);

            const insertCall = sharedMockDb.runAsync.mock.calls.find((c) => (c[0] as string).includes('INSERT INTO todos'));
            const params = insertCall![1] as any[];
            expect(params[3]).toBe('2025-06-15T10:30:00.000Z'); // createdAt
        });

        it('配列フィールドを JSON 文字列に変換すること', async () => {
            const todo = {
                id: 'test-3', title: 'Tags Test', completed: false,
                createdAt: new Date(), updatedAt: new Date(),
                tags: ['math', 'science'],
                reviewHistory: [{ date: '2025-01-01', correct: true }],
            };
            await repo.addTodo(todo as any);

            const insertCall = sharedMockDb.runAsync.mock.calls.find((c) => (c[0] as string).includes('INSERT INTO todos'));
            const params = insertCall![1] as any[];
            expect(params[16]).toBe(JSON.stringify(['math', 'science'])); // tags
        });

        it('fromDB が ISO 文字列を Date に変換すること', async () => {
            const isoDate = '2025-01-01T10:00:00.000Z';
            sharedMockDb.getAllAsync.mockResolvedValueOnce([
                { id: '1', title: 'Test', completed: 0, createdAt: isoDate, updatedAt: isoDate, tags: null, reviewHistory: null },
            ]);

            const todos = await repo.getTodos();
            expect(todos).toHaveLength(1);
            expect(todos[0].completed).toBe(false);
            expect(todos[0].createdAt).toBeInstanceOf(Date);
            expect((todos[0].createdAt as Date).toISOString()).toBe(isoDate);
        });

        it('fromDB が JSON 文字列を配列に変換すること', async () => {
            sharedMockDb.getAllAsync.mockResolvedValueOnce([
                { id: '1', title: 'Test', completed: 1, tags: '["a","b"]', reviewHistory: '[]', createdAt: null, updatedAt: null },
            ]);

            const todos = await repo.getTodos();
            expect(todos[0].completed).toBe(true);
            expect(todos[0].tags).toEqual(['a', 'b']);
            expect(todos[0].reviewHistory).toEqual([]);
        });

        it('fromDB が無効な JSON をフォールバックすること', async () => {
            sharedMockDb.getAllAsync.mockResolvedValueOnce([
                { id: '1', title: 'Test', completed: 0, tags: 'invalid-json', createdAt: null, updatedAt: null },
            ]);

            const todos = await repo.getTodos();
            expect(todos[0].tags).toEqual([]);
        });

        it('fromDB が null 入力で undefined を返すこと', async () => {
            sharedMockDb.getFirstAsync.mockResolvedValueOnce(null);
            const todo = await repo.getTodo('nonexistent');
            expect(todo).toBeUndefined();
        });

        it('fromDB が "HH:mm" 形式を文字列のまま保持すること', async () => {
            sharedMockDb.getAllAsync.mockResolvedValueOnce([
                { id: '1', title: 'Test', completed: 0, dueTime: '09:30', endTime: '10:00', createdAt: null, updatedAt: null },
            ]);

            const todos = await repo.getTodos();
            expect(todos[0].dueTime).toBe('09:30');
            expect(todos[0].endTime).toBe('10:00');
        });
    });

    // ============================================================
    // CRUD: Todos
    // ============================================================
    describe('Todo CRUD', () => {
        it('addTodo が INSERT SQL を実行すること', async () => {
            const todo = { id: 't1', title: 'New Todo', completed: false, createdAt: new Date(), updatedAt: new Date() };
            await repo.addTodo(todo as any);

            expect(sharedMockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO todos'),
                expect.arrayContaining(['t1', 'New Todo'])
            );
        });

        it('getTodos が getAllAsync を呼ぶこと', async () => {
            sharedMockDb.getAllAsync.mockResolvedValueOnce([]);
            const todos = await repo.getTodos();
            expect(sharedMockDb.getAllAsync).toHaveBeenCalledWith('SELECT * FROM todos');
            expect(todos).toEqual([]);
        });

        it('getTodo が getFirstAsync を呼ぶこと', async () => {
            sharedMockDb.getFirstAsync.mockResolvedValueOnce(null);
            await repo.getTodo('t1');
            expect(sharedMockDb.getFirstAsync).toHaveBeenCalledWith('SELECT * FROM todos WHERE id = ?', ['t1']);
        });

        it('updateTodo が許可カラムのみ UPDATE すること', async () => {
            sharedMockDb.getFirstAsync.mockResolvedValueOnce({ id: 't1', title: 'Updated', completed: 0 });
            await repo.updateTodo('t1', { title: 'Updated' } as any);

            expect(sharedMockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE todos SET'),
                expect.arrayContaining(['Updated', 't1'])
            );
        });

        it('updateTodo が空の更新で何もしないこと', async () => {
            await repo.updateTodo('t1', {} as any);
            expect(sharedMockDb.runAsync).not.toHaveBeenCalled();
        });

        it('deleteTodo が DELETE SQL を実行すること', async () => {
            sharedMockDb.getFirstAsync.mockResolvedValueOnce({ id: 't1', title: 'X', completed: 0 });
            await repo.deleteTodo('t1');
            expect(sharedMockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM todos'),
                expect.arrayContaining(['t1'])
            );
        });

        it('deleteTodo が SRS ルート削除時に子もカスケード削除すること', async () => {
            sharedMockDb.getFirstAsync.mockResolvedValueOnce({
                id: 'root1', title: 'SRS Root', completed: 0, srsGroupId: 'root1'
            });
            sharedMockDb.getAllAsync.mockResolvedValueOnce([{ id: 'child1' }, { id: 'child2' }]);

            await repo.deleteTodo('root1');

            expect(sharedMockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM todos WHERE id IN'),
                expect.arrayContaining(['root1', 'child1', 'child2'])
            );
        });

        it('deleteTodosByGroupId が groupId でまとめて削除すること', async () => {
            sharedMockDb.getAllAsync.mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }]);
            await repo.deleteTodosByGroupId('group1');

            expect(sharedMockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM todos WHERE srsGroupId = ?'),
                ['group1']
            );
        });

        it('deleteTodosByGroupId が空 groupId で何もしないこと', async () => {
            await repo.deleteTodosByGroupId('');
            expect(sharedMockDb.runAsync).not.toHaveBeenCalled();
        });
    });

    // ============================================================
    // CRUD: Categories
    // ============================================================
    describe('Category CRUD', () => {
        it('addCategory が INSERT SQL を実行すること', async () => {
            const cat = { id: 'c1', name: 'Math', level: 'large', order: 0, createdAt: new Date(), updatedAt: new Date() };
            await repo.addCategory(cat as any);

            expect(sharedMockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO categories'),
                expect.arrayContaining(['c1', 'Math'])
            );
        });

        it('getCategories が全カテゴリを返すこと', async () => {
            sharedMockDb.getAllAsync.mockResolvedValueOnce([
                { id: 'c1', name: 'Math', completed: 0, isDefault: 0 }
            ]);

            const cats = await repo.getCategories();
            expect(cats).toHaveLength(1);
            expect(cats[0].name).toBe('Math');
        });

        it('deleteCategory が DELETE SQL を実行すること', async () => {
            await repo.deleteCategory('c1');
            expect(sharedMockDb.runAsync).toHaveBeenCalledWith('DELETE FROM categories WHERE id = ?', ['c1']);
        });
    });

    // ============================================================
    // CRUD: SRS Profiles
    // ============================================================
    describe('SRSProfile CRUD', () => {
        it('addSRSProfile が intervals を JSON 文字列化して INSERT すること', async () => {
            const profile = { id: 's1', name: 'Default', intervals: [1, 3, 7], isDefault: true, createdAt: new Date(), updatedAt: new Date() };
            await repo.addSRSProfile(profile as any);

            const insertCall = sharedMockDb.runAsync.mock.calls.find((c) => (c[0] as string).includes('INSERT INTO srsProfiles'));
            expect(insertCall).toBeDefined();
            const params = insertCall![1] as any[];
            expect(params[2]).toBe(JSON.stringify([1, 3, 7])); // intervals
            expect(params[3]).toBe(1); // isDefault
        });

        it('deleteSRSProfile が DELETE SQL を実行すること', async () => {
            await repo.deleteSRSProfile('s1');
            expect(sharedMockDb.runAsync).toHaveBeenCalledWith('DELETE FROM srsProfiles WHERE id = ?', ['s1']);
        });
    });

    // ============================================================
    // CRUD: Sessions
    // ============================================================
    describe('Session CRUD', () => {
        it('addSession が INSERT SQL を実行すること', async () => {
            const session = { id: 'sess1', todoId: 't1', todoTitle: 'Study', duration: 1500, mode: 'pomodoro', createdAt: new Date() };
            await repo.addSession(session as any);

            expect(sharedMockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO sessions'),
                expect.arrayContaining(['sess1', 't1', 'Study', 1500, 'pomodoro'])
            );
        });

        it('getSessions が全セッションを返すこと', async () => {
            sharedMockDb.getAllAsync.mockResolvedValueOnce([
                { id: 'sess1', todoId: 't1', todoTitle: 'Study', duration: 1500, mode: 'pomodoro', createdAt: '2025-01-01T00:00:00.000Z' }
            ]);

            const sessions = await repo.getSessions();
            expect(sessions).toHaveLength(1);
            expect(sessions[0].duration).toBe(1500);
        });
    });

    // ============================================================
    // onDataChange Listener
    // ============================================================
    describe('onDataChange', () => {
        it('addTodo でリスナーが呼ばれること', async () => {
            const listener = vi.fn();
            repo.onDataChange(listener);

            const todo = { id: 't1', title: 'Test', completed: false, createdAt: new Date(), updatedAt: new Date() };
            await repo.addTodo(todo as any);

            expect(listener).toHaveBeenCalledWith('todos', 'INSERT', todo);
        });

        it('unsubscribe でリスナーが解除されること', async () => {
            const listener = vi.fn();
            const unsub = repo.onDataChange(listener);
            unsub();

            const todo = { id: 't1', title: 'Test', completed: false, createdAt: new Date(), updatedAt: new Date() };
            await repo.addTodo(todo as any);

            expect(listener).not.toHaveBeenCalled();
        });

        it('複数リスナーが全て通知されること', async () => {
            const listener1 = vi.fn();
            const listener2 = vi.fn();
            repo.onDataChange(listener1);
            repo.onDataChange(listener2);

            await repo.deleteCategory('c1');

            expect(listener1).toHaveBeenCalledWith('categories', 'DELETE', { id: 'c1' });
            expect(listener2).toHaveBeenCalledWith('categories', 'DELETE', { id: 'c1' });
        });
    });
});
