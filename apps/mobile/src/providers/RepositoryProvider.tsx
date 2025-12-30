import React, { createContext, useContext, ReactNode } from "react";
import { StorageInterface } from "@pomarc/shared";
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
    // If not provided, use/create singleton
    const activeRepository = repository || (repositoryInstance || (repositoryInstance = new SQLiteRepository()));

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
