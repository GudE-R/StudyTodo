import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Todo } from '@pomarc/shared';
import { useMobileTodos } from '../../hooks/useMobileTodos';
import { isSameDay } from 'date-fns';

interface MobileTodoListProps {
    date?: Date;
}

export const MobileTodoList = ({ date = new Date() }: MobileTodoListProps) => {
    const { todos, loading, refreshTodos, updateTodo } = useMobileTodos();

    // Load and Subscribe
    useEffect(() => {
        refreshTodos();
    }, [refreshTodos]);

    // Filter todos for the selected date
    const filteredTodos = todos.filter(todo => {
        if (todo.completed) return false;

        if (!todo.dueDate) {
            // If no due date, show it in the list for now
            return true;
        }
        // Ensure we compare Date objects
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
        <TouchableOpacity style={styles.item} onPress={() => handleToggle(item)}>
            <View style={[styles.checkbox, item.completed && styles.checked]}>
                {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.content}>
                <Text style={[styles.title, item.completed && styles.completedText]}>
                    {item.title}
                </Text>
                {item.dueDate && (
                    <Text style={styles.time}>
                        {new Date(item.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    if (loading && todos.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>Loading...</Text>
            </View>
        );
    }

    if (filteredTodos.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No tasks for this day</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.debugHeader}>
                <Text style={styles.debugText}>Tasks: {filteredTodos.length} / {todos.length}</Text>
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
        backgroundColor: '#fff',
    },
    debugHeader: {
        paddingHorizontal: 12,
        paddingTop: 4,
        backgroundColor: '#f8fafc',
    },
    debugText: {
        fontSize: 10,
        color: '#64748b',
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
        color: '#aaa',
        fontSize: 14,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#3b82f6',
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checked: {
        backgroundColor: '#3b82f6',
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
        color: '#1e293b',
        fontWeight: '500',
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: '#94a3b8',
    },
    time: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    }
});
