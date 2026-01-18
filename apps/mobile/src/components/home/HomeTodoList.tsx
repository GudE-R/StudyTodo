import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Todo } from '@pomarc/shared';
import { useMobileTodos } from '../../hooks/useMobileTodos';
import { isSameDay } from 'date-fns';
import { useThemeColors } from '../../providers/ThemeProvider';

interface HomeTodoListProps {
    date?: Date;
}

export const HomeTodoList = ({ date = new Date() }: HomeTodoListProps) => {
    const { todos, loading, refreshTodos, updateTodo } = useMobileTodos();
    const { colors } = useThemeColors();

    useEffect(() => {
        refreshTodos();
    }, [refreshTodos]);

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

    const renderItem = ({ item }: { item: Todo }) => (
        <TouchableOpacity style={[styles.item, { borderBottomColor: colors.border }]} onPress={() => handleToggle(item)}>
            <View style={[styles.checkbox, { borderColor: colors.primary }, item.completed && { backgroundColor: colors.primary }]}>
                {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.text }, item.completed && { color: colors.textMuted, textDecorationLine: 'line-through' }]}>
                    {item.title}
                </Text>
                {item.dueDate && (() => {
                    const d = new Date(item.dueDate);
                    return !isNaN(d.getTime()) ? (
                        <Text style={[styles.time, { color: colors.textSecondary }]}>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    ) : null;
                })()}
            </View>
        </TouchableOpacity>
    );

    if (loading && todos.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Loading...</Text>
            </View>
        );
    }

    if (filteredTodos.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No tasks for this day</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.debugHeader, { backgroundColor: colors.surface }]}>
                <Text style={[styles.debugText, { color: colors.textSecondary }]}>Tasks: {filteredTodos.length} / {todos.length}</Text>
            </View>
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
    debugHeader: {
        paddingHorizontal: 12,
        paddingTop: 4,
    },
    debugText: {
        fontSize: 10,
        fontWeight: 'bold',
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

