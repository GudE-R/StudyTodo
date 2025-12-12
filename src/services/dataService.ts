import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { mapper } from "@/lib/mapper";
import { Todo, Session, Category, SRSProfile } from "@/types";

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

    async updateTodo(id: string, updates: Partial<Todo>) {
        await db.todos.update(id, updates);

        // Fetch full updated object for cloud sync efficiently?
        // Actually, we need the FULL object for upsert, OR we can just patch.
        // Supabase update takes partial.
        this.syncToCloud("todos", { id, ...updates }, "update");
    },

    async deleteTodo(id: string) {
        await db.todos.delete(id);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            supabase.from("todos").delete().eq("id", id).then(({ error }) => {
                if (error) console.error("Cloud delete error", error);
            });
        }
    },

    // --- Sessions ---
    async addSession(session: Session) {
        await db.sessions.add(session);
        this.syncToCloud("sessions", session);
    },

    // --- Helper ---
    async syncToCloud(table: string, data: any, mode: "upsert" | "update" = "upsert") {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Not logged in, local only

        try {
            const payload = mapper.toSupabase({ ...data, userId: user.id });

            if (mode === "upsert") {
                const { error } = await supabase.from(table).upsert(payload);
                if (error) throw error;
            } else {
                const { id, ...rest } = payload;
                if (!id) return;
                const { error } = await supabase.from(table).update(rest).eq("id", id);
                if (error) throw error;
            }
        } catch (e) {
            console.error(`Cloud Sync Error (${table}):`, e);
            // TODO: Add to "Pending Sync" queue for retry
        }
    }
};
