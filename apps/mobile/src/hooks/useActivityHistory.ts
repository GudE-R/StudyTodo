import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Todo, Category } from '@studytodo/shared';
import { isCategoryMatch } from '../lib/categoryUtils';

interface UseActivityHistoryProps {
    todos: Todo[];
    categories: Category[];
    deleteTodo: (id: string) => Promise<void>;
}

export const useActivityHistory = ({ todos, categories, deleteTodo }: UseActivityHistoryProps) => {
    const { t } = useTranslation();
    const [historyFilterCategory, setHistoryFilterCategory] = useState<string>("all");
    const [historyFilterStatus, setHistoryFilterStatus] = useState<"all" | "completed" | "incomplete">("all");
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const historyList = useMemo(() => {
        const filtered = todos.filter(t => {
            if (historyFilterCategory !== 'all' && !isCategoryMatch(t.categoryId, historyFilterCategory, categories)) return false;
            if (historyFilterStatus === 'completed' && !t.completed) return false;
            if (historyFilterStatus === 'incomplete' && t.completed) return false;
            return true;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const items: (Todo | { type: 'group', id: string, todos: Todo[], title: string, createdAt: Date, completedCount: number })[] = [];
        const seenGroups = new Set<string>();

        filtered.forEach(todo => {
            if (todo.srsGroupId) {
                if (!seenGroups.has(todo.srsGroupId)) {
                    seenGroups.add(todo.srsGroupId);
                    const groupTodos = filtered.filter(t => t.srsGroupId === todo.srsGroupId)
                        .sort((a, b) => {
                            if (!a.dueDate) return 1;
                            if (!b.dueDate) return -1;
                            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                        });
                    items.push({
                        type: 'group',
                        id: todo.srsGroupId,
                        todos: groupTodos,
                        title: groupTodos[0].title,
                        createdAt: new Date(groupTodos[0].createdAt),
                        completedCount: groupTodos.filter(t => t.completed).length
                    });
                }
            } else {
                items.push(todo);
            }
        });
        return items;
    }, [todos, historyFilterCategory, historyFilterStatus, categories]);

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleGroup = (id: string) => {
        const next = new Set(expandedGroups);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedGroups(next);
    };

    const toggleGroupSelection = (groupTodos: Todo[]) => {
        const next = new Set(selectedIds);
        const allSelected = groupTodos.every(t => selectedIds.has(t.id));

        if (allSelected) {
            groupTodos.forEach(t => next.delete(t.id));
        } else {
            groupTodos.forEach(t => next.add(t.id));
        }
        setSelectedIds(next);
    }

    const handleBulkDelete = () => {
        Alert.alert(
            t('activity.deleteTitle', "Delete Tasks"),
            t('activity.deleteTodoConfirm', `Are you sure you want to delete {count} tasks?`).replace('{count}', selectedIds.size.toString()),
            [
                { text: t('common.cancel', "Cancel"), style: "cancel" },
                {
                    text: t('common.delete', "Delete"),
                    style: "destructive",
                    onPress: async () => {
                        const ids = Array.from(selectedIds);
                        for (const id of ids) {
                            await deleteTodo(id);
                        }
                        setSelectedIds(new Set());
                        setIsSelectionMode(false);
                    }
                }
            ]
        );
    };

    const resetSelection = () => {
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        setExpandedGroups(new Set());
    };

    return {
        historyFilterCategory,
        setHistoryFilterCategory,
        historyFilterStatus,
        setHistoryFilterStatus,
        isSelectionMode,
        setIsSelectionMode,
        selectedIds,
        expandedGroups,
        historyList,
        toggleSelection,
        toggleGroup,
        toggleGroupSelection,
        handleBulkDelete,
        resetSelection
    };
};
