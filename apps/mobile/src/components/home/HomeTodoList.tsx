import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Todo, Category } from '@studytodo/shared';
import { useMobileTodos } from '../../hooks/useMobileTodos';
import { useMobileCategories } from '../../hooks/useMobileCategories';
import { isSameDay } from 'date-fns';
import { useThemeColors } from '../../providers/ThemeProvider';

interface HomeTodoListProps {
    date?: Date;
    onTodoPress?: (todo: Todo) => void;
}

import { useTranslation } from 'react-i18next';

export const HomeTodoList = ({ date = new Date(), onTodoPress }: HomeTodoListProps) => {
    const { todos, loading, refreshTodos, updateTodo } = useMobileTodos();
    const { categories } = useMobileCategories();
    const { colors } = useThemeColors();
    const { t } = useTranslation();

    useEffect(() => {
        refreshTodos();
    }, [refreshTodos]);

    // Flatten categories for quick lookup
    const categoryMap = useMemo(() => {
        const map = new Map<string, Category>();
        const traverse = (cats: Category[]) => {
            cats.forEach(cat => {
                map.set(cat.id, cat);
                if (cat.children) traverse(cat.children);
            });
        };
        traverse(categories);
        return map;
    }, [categories]);

    const getCategoryColor = (categoryId?: string): string | null => {
        if (!categoryId) return null;
        const category = categoryMap.get(categoryId);
        return category?.color || null;
    };

    const filteredTodos = todos.filter(todo => {
        if (todo.completed) return false;
        if (!todo.dueDate) return true;
        const todoDate = todo.dueDate instanceof Date ? todo.dueDate : new Date(todo.dueDate);
        return isSameDay(todoDate, date);
    });

    const handleToggle = async (todo: Todo) => {
        await updateTodo(todo.id, {
            completed: !todo.completed,
            updatedAt: new Date()
        });
    };

    const renderItem = ({ item }: { item: Todo }) => {
        const categoryColor = getCategoryColor(item.categoryId);
        return (
            <TouchableOpacity
                style={[styles.item, { borderBottomColor: colors.border }]}
                onPress={() => onTodoPress?.(item)}
            >
                {/* Category Color Indicator */}
                <View style={[
                    styles.categoryIndicator,
                    { backgroundColor: categoryColor || 'transparent' }
                ]} />
                <TouchableOpacity
                    style={[styles.checkbox, { borderColor: categoryColor || colors.primary }, item.completed && { backgroundColor: categoryColor || colors.primary }]}
                    onPress={() => handleToggle(item)}
                >
                    {item.completed && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                <View style={styles.content}>
                    <Text style={[styles.title, { color: colors.text }, item.completed && { color: colors.textMuted, textDecorationLine: 'line-through' }]}>
                        {item.title}
                    </Text>
                    {item.dueTime && (
                        <Text style={[styles.time, { color: colors.textSecondary }]}>{item.dueTime}</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && todos.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('common.loading', 'Loading...')}</Text>
            </View>
        );
    }

    if (filteredTodos.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('common.noTasks', 'No tasks for this day')}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={filteredTodos}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    list: {
        padding: 8,
    },
    emptyContainer: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
    },
    categoryIndicator: {
        width: 4,
        height: '80%',
        borderRadius: 2,
        marginRight: 10,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmark: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '500',
    },
    time: {
        fontSize: 11,
        marginTop: 2,
    }
});

