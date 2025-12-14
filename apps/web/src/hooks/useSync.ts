"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { syncToSupabase } from "@/lib/migration";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export function useSync() {
    const [isSyncing, setIsSyncing] = useState(false);

    // Auto-sync on mount if user is logged in
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                try {
                    setIsSyncing(true);
                    await syncToSupabase(session.user.id);
                } catch (error) {
                    console.error("Auto-sync failed", error);
                } finally {
                    setIsSyncing(false);
                }
            }
        };
        checkUser();
    }, []);

    // Periodic sync could be added here
    return { isSyncing };
}
