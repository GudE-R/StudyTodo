import { useState, useCallback, useEffect } from "react";
import { Category } from "@studytodo/shared";
import { useRepository } from "../providers/RepositoryProvider";

export function useMobileCategories() {
    const repository = useRepository();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshCategories = useCallback(async () => {
        setLoading(true);
        try {
            const data = await repository.getCategories();
            setCategories(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [repository]);

    // Initial load and Subscription
    useEffect(() => {
        refreshCategories();

        const unsubscribe = repository.onDataChange?.((table, type, data) => {
            if (table === 'categories') {
                console.log('[useMobileCategories] Data change detected, refreshing...', type);
                refreshCategories();
            }
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [refreshCategories, repository]);

    const addCategory = async (category: Category) => {
        await repository.addCategory(category);
        await refreshCategories();
    };

    const updateCategory = async (id: string, updates: Partial<Category>) => {
        await repository.updateCategory(id, updates);
        await refreshCategories();
    };

    const deleteCategory = async (id: string) => {
        await repository.deleteCategory(id);
        await refreshCategories();
    };

    return {
        categories,
        loading,
        refreshCategories,
        addCategory,
        updateCategory,
        deleteCategory
    };
}
