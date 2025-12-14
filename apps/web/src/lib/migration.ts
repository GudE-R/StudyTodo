import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { mapper } from "@/lib/mapper";

/**
 * Migration Utility
 * Sync local Dexie data to Supabase
 */
export async function syncToSupabase(userId: string) {
    if (!userId) throw new Error("User ID is required");

    try {
        // 1. Categories
        const categories = await db.categories.toArray();
        if (categories.length > 0) {
            const { error } = await supabase
                .from('categories')
                .upsert(categories.map(c => ({ ...mapper.toSupabase(c), user_id: userId })));

            if (error) throw new Error(`Categories Sync Error: ${error.message}`);
        }

        // 2. SRS Profiles
        const srsProfiles = await db.srsProfiles.toArray();
        if (srsProfiles.length > 0) {
            const { error } = await supabase
                .from('srs_profiles')
                .upsert(srsProfiles.map(s => ({ ...mapper.toSupabase(s), user_id: userId })));

            if (error) throw new Error(`SRS Profiles Sync Error: ${error.message}`);
        }

        // 3. Todos
        const todos = await db.todos.toArray();
        if (todos.length > 0) {
            const { error } = await supabase
                .from('todos')
                .upsert(todos.map(t => ({ ...mapper.toSupabase(t), user_id: userId })));

            if (error) throw new Error(`Todos Sync Error: ${error.message}`);
        }

        // 4. Sessions
        const sessions = await db.sessions.toArray();
        if (sessions.length > 0) {
            const { error } = await supabase
                .from('sessions')
                .upsert(sessions.map(s => ({ ...mapper.toSupabase(s), user_id: userId })));

            if (error) throw new Error(`Sessions Sync Error: ${error.message}`);
        }

        return {
            categories: categories.length,
            srsProfiles: srsProfiles.length,
            todos: todos.length,
            sessions: sessions.length
        };

    } catch (error: any) {
        console.error("Migration Failed:", error);
        throw error;
    }
}
