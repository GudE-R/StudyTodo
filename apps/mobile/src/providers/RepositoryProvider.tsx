import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { StorageInterface } from "@studytodo/shared";
import { SQLiteRepository } from "../repositories/SQLiteRepository";

const RepositoryContext = createContext<StorageInterface | null>(null);

// singleton instance for app usage
let repositoryInstance: StorageInterface | null = null;

export function RepositoryProvider({
    children,
    repository
}: {
    children: ReactNode;
    repository?: StorageInterface;
}) {
    const activeRepository = useMemo(() => {
        if (repository) return repository;

        if (!repositoryInstance) {
            try {
                repositoryInstance = new SQLiteRepository();
            } catch (error) {
                console.error("Failed to initialize SQLiteRepository:", error);
                return null;
            }
        }
        return repositoryInstance;
    }, [repository]);

    if (!activeRepository) {
        return null;
    }

    return (
        <RepositoryContext.Provider value={activeRepository}>
            {children}
        </RepositoryContext.Provider>
    );
}

export function useRepository() {
    const context = useContext(RepositoryContext);
    if (!context) {
        throw new Error("useRepository must be used within a RepositoryProvider");
    }
    return context;
}
