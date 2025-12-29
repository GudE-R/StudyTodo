import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Todo } from '@pomarc/shared';
import { useMobileTodos } from '../../hooks/useMobileTodos';
import { isSameDay } from 'date-fns';

interface MobileTodoListProps {
    date?: Date;
}

export const MobileTodoList = ({ date = new Date() }: MobileTodoListProps) => {
    const { todos, loading, refreshTodos, updateTodo } = useMobileTodos();

    useEffect(() => {
        refreshTodos();
    }, [refreshTodos]);

    // Filter todos for the selected date
    const filteredTodos = todos.filter(todo => {
        if (!todo.dueDate) return false;
        return isSameDay(new Date(todo.dueDate), date);
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
        borderBottomColor: '#f0f0f0',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#007AFF',
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checked: {
        backgroundColor: '#007AFF',
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
        color: '#333',
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    time: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
    }
});
