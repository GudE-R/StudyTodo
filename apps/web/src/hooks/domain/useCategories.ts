"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useRepository } from "@/providers/RepositoryProvider";
import { Category, buildCategoryTree } from "@pomarc/shared";

export function useCategories() {
    const repository = useRepository();

    const categories = useLiveQuery(() => db.categories.toArray()) || [];
    const categoryTree = buildCategoryTree(categories);

    const addCategory = async (category: Category) => {
        await repository.addCategory(category);
    };

    const updateCategory = async (id: string, updates: Partial<Category>) => {
        await repository.updateCategory(id, updates);
    };

    const deleteCategory = async (id: string) => {
        await repository.deleteCategory(id);
    };

    return {
        categories,
        categoryTree, // Convinience
        addCategory,
        updateCategory,
        deleteCategory
    };
}
