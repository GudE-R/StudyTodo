import React, { createContext, useContext, ReactNode } from "react";
import { StorageInterface } from "@pomarc/shared";
import { SQLiteRepository } from "../repositories/SQLiteRepository";

const RepositoryContext = createContext<StorageInterface | null>(null);

const repository = new SQLiteRepository();

export function RepositoryProvider({ children }: { children: ReactNode }) {
    return (
        <RepositoryContext.Provider value={repository}>
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
