import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { mapper } from "@/lib/mapper";
import { Todo, Session, Category, SRSProfile } from "@/types";
import { addDays } from "date-fns";
import { generateId } from "@/lib/utils";

/**
 * Data Service
 * ローカルDB(Dexie)とクラウドDB(Supabase)への書き込みを抽象化します。
 * "Dual Write" 戦略を実装。
 */
export const dataService = {
    // --- Todos ---
    async addTodo(todo: Todo) {
        // 1. Local
        await db.todos.add(todo);

        // 2. Cloud (Fire and Forget or Await?)
        // UXのためにAwaitしない手もあるが、整合性のためAwait推奨。ただしエラーで止まらないように。
        this.syncToCloud("todos", todo);
    },

    /**
     * SRSプロファイルに基づいて、複数のTodo(復習)を一括生成・保存します。
     */
    async addSRSTodos(baseTodo: Todo, intervals: number[]) {
        const baseId = generateId();
        // Base Todo
        const todoWithId: Todo = {
            ...baseTodo,
            id: baseId,
            srsGroupId: baseId, // Self-reference for Root
            createdAt: new Date(),
            updatedAt: new Date(),
            completed: false,
        };
        const todosToAdd: Todo[] = [todoWithId];
        const baseDate = baseTodo.dueDate || new Date();

        intervals.forEach((days, index) => {
            const reviewTodo: Todo = {
                ...baseTodo,
                id: generateId(),
                title: `${baseTodo.title} (${index + 1}回目)`, // Updated format
                dueDate: addDays(baseDate, days),
                completed: false,
                updatedAt: new Date(),
                createdAt: new Date(),
                srsGroupId: baseId, // Link to Root
            };
            todosToAdd.push(reviewTodo);
        });

        // Batch insert to Local DB
        await db.transaction('rw', db.todos, async () => {
            await db.todos.bulkAdd(todosToAdd);
        });

        // Sync each to Cloud
        this.syncToCloud("todos", todosToAdd, "upsert");
    },

    async updateTodo(id: string, updates: Partial<Todo>) {
        await db.todos.update(id, updates);

        // Fetch full updated object for cloud sync efficiently?
        // Actually, we need the FULL object for upsert, OR we can just patch.
        // Supabase update takes partial.
        this.syncToCloud("todos", { id, ...updates }, "update");
    },

    async deleteTodo(id: string) {
        // Check for SRS Cascade
        const todo = await db.todos.get(id);
        const idsToDelete: string[] = [id];

        if (todo && todo.srsGroupId && todo.srsGroupId === id) {
            // This is the Root SRS Todo -> Cascade Delete Children
            const children = await db.todos.where('srsGroupId').equals(id).toArray();
            children.forEach(c => {
                if (c.id !== id) idsToDelete.push(c.id);
            });
        }

        // Bulk Delete Local
        await db.todos.bulkDelete(idsToDelete);

        // Bulk Delete Cloud
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Supabase 'in' query for bulk delete
            const { error } = await supabase.from("todos").delete().in("id", idsToDelete);
            if (error) console.error("Cloud delete error", error);
        }
    },

    // --- Sessions ---
    async addSession(session: Session) {
        await db.sessions.add(session);
        this.syncToCloud("sessions", session);
    },

    // --- Helper ---
    async syncToCloud(table: string, data: any | any[], mode: "upsert" | "update" = "upsert") {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Not logged in, local only

        try {
            // Handle Array or Single Object
            const dataArray = Array.isArray(data) ? data : [data];
            const payload = dataArray.map(item => mapper.toSupabase({ ...item, userId: user.id }));

            if (mode === "upsert") {
                const { error } = await supabase.from(table).upsert(payload);
                if (error) throw error;
            } else {
                // Update usually targets logic by ID, loop if multiple
                for (const p of payload) {
                    const { id, ...rest } = p;
                    if (!id) continue;
                    const { error } = await supabase.from(table).update(rest).eq("id", id);
                    if (error) throw error;
                }
            }
        } catch (e) {
            console.error(`Cloud Sync Error (${table}):`, e);
            // TODO: Add to "Pending Sync" queue for retry
        }
    }
};
