import { useState, useCallback, useEffect } from "react";
import { Category } from "@pomarc/shared";
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

    // Initial load
    useEffect(() => {
        refreshCategories();
    }, [refreshCategories]);

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
