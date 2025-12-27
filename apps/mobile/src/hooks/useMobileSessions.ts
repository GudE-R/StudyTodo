
import { useState, useCallback } from "react";
import { Session } from "@pomarc/shared";
import { useRepository } from "../providers/RepositoryProvider";

export function useMobileSessions() {
    const repository = useRepository();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshSessions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await repository.getSessions();
            setSessions(data);
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        } finally {
            setLoading(false);
        }
    }, [repository]);

    const addSession = async (session: Session) => {
        await repository.addSession(session);
        await refreshSessions();
    };

    return {
        sessions,
        loading,
        refreshSessions,
        addSession
    };
}
