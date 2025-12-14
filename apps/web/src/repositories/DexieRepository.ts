import { StorageInterface, Todo, Category, SRSProfile, Session } from "@pomarc/shared";
import { db } from "@/lib/db";

export class DexieRepository implements StorageInterface {

    // Todos
    /** Todo一覧をDexieから取得します */
    async getTodos(): Promise<Todo[]> {
        return await db.todos.toArray();
    }

    async getTodo(id: string): Promise<Todo | undefined> {
        return await db.todos.get(id);
    }

    async addTodo(todo: Todo): Promise<void> {
        await db.todos.add(todo);
    }

    /** 
     * Todoを更新します
     * Note: Dexieの型定義とRecursive Typeの相性問題のため、updatesをanyにキャストしています。
     */
    async updateTodo(id: string, updates: Partial<Todo>): Promise<void> {
        await db.todos.update(id, updates as any);
    }

    async deleteTodo(id: string): Promise<void> {
        await db.todos.delete(id);
    }

    // Categories
    async getCategories(): Promise<Category[]> {
        return await db.categories.toArray();
    }

    async addCategory(category: Category): Promise<void> {
        await db.categories.add(category);
    }

    async updateCategory(id: string, updates: any): Promise<void> {
        await db.categories.update(id, updates as any);
    }

    async deleteCategory(id: string): Promise<void> {
        await db.categories.delete(id);
    }

    // SRS Profiles
    async getSRSProfiles(): Promise<SRSProfile[]> {
        return await db.srsProfiles.toArray();
    }

    async addSRSProfile(profile: SRSProfile): Promise<void> {
        await db.srsProfiles.add(profile);
    }

    async updateSRSProfile(id: string, updates: Partial<SRSProfile>): Promise<void> {
        await db.srsProfiles.update(id, updates as any);
    }

    async deleteSRSProfile(id: string): Promise<void> {
        await db.srsProfiles.delete(id);
    }

    // Sessions
    async addSession(session: Session): Promise<void> {
        await db.sessions.add(session);
    }

    async getSessions(): Promise<Session[]> {
        return await db.sessions.toArray();
    }
}
