import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { Todo, Session, Feedback, mapper, generateSRSTodos, generateSRSTodosForExisting } from "@studytodo/shared";
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
        const todosToAdd = generateSRSTodos(baseTodo, intervals, generateId);

        // Batch insert to Local DB
        await db.transaction('rw', db.todos, async () => {
            await db.todos.bulkAdd(todosToAdd);
        });

        // Sync each to Cloud
        this.syncToCloud("todos", todosToAdd, "upsert");
    },

    /**
     * 既存のTodoに後からSRSを適用します。
     * 親タスク(対象Todo)にsrsGroupIdを設定し、子タスク(復習)を生成します。
     */
    async applySrsToExistingTodo(todo: Todo, intervals: number[]) {
        const { updatedBase, children } = generateSRSTodosForExisting(todo, intervals, generateId);

        // Update Base Todo if needed
        if (updatedBase.srsGroupId !== todo.srsGroupId) {
            await this.updateTodo(updatedBase.id, { srsGroupId: updatedBase.srsGroupId });
        }

        // Batch insert children
        await db.transaction('rw', db.todos, async () => {
            await db.todos.bulkAdd(children);
        });

        this.syncToCloud("todos", children, "upsert");
    },


    /**
     * ルーティーン設定に基づいて、今後30日間のタスクを一括生成します。
     */
    async addRoutineTodos(baseTodo: Todo, routineDays: number[]) {
        const groupId = generateId();
        const now = new Date();
        const todosToAdd: Todo[] = [];

        // 30日分の日付をチェックして該当する曜日のタスクを作成
        for (let i = 0; i < 30; i++) {
            const date = addDays(now, i);
            const dayOfWeek = date.getDay(); // 0:日, 1:月...

            if (routineDays.includes(dayOfWeek)) {
                const routineTodo: Todo = {
                    ...baseTodo,
                    id: generateId(),
                    dueDate: date,
                    completed: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    srsGroupId: groupId, // ルーティーンの一括削除等のためにグループIDとして使用
                };
                // 初回のみ id と groupId を一致させて「親」とする
                if (todosToAdd.length === 0) {
                    routineTodo.id = groupId;
                }

                todosToAdd.push(routineTodo);
            }
        }

        if (todosToAdd.length > 0) {
            await db.transaction('rw', db.todos, async () => {
                await db.todos.bulkAdd(todosToAdd);
            });
            this.syncToCloud("todos", todosToAdd, "upsert");
        }
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
            if (error) console.error("Cloud delete error:", JSON.stringify(error, null, 2));
        }
    },

    // --- Sessions ---
    async addSession(session: Session) {
        await db.sessions.add(session);
        this.syncToCloud("sessions", session);
    },

    // --- Feedbacks ---
    async addFeedback(feedback: Feedback) {
        await db.feedbacks.add(feedback);
        this.syncToCloud("feedbacks", feedback);
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
