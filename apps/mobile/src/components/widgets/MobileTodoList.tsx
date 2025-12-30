import React, { useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { Todo } from "@pomarc/shared";
import { useMobileTodos } from "../../hooks/useMobileTodos";

interface MobileTodoListProps {
    todos: Todo[];
    onToggle: (todo: Todo) => void;
    loading: boolean;
}

export function MobileTodoList({ todos, onToggle, loading }: MobileTodoListProps) {

    // Logic lifted to parent

    const renderItem = ({ item }: { item: Todo }) => (
        <TouchableOpacity style={styles.item} onPress={() => onToggle(item)}>
            <View style={[styles.checkbox, item.completed && styles.checked]}>
                {item.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.content}>
                <Text style={[styles.title, item.completed && styles.completedText]}>
                    {item.title}
                </Text>
                {item.dueDate && (() => {
                    const d = new Date(item.dueDate);
                    return !isNaN(d.getTime()) ? (
                        <Text style={styles.date}>{d.toLocaleDateString()}</Text>
                    ) : null;
                })()}
            </View>
        </TouchableOpacity>
    );

    if (loading && todos.length === 0) {
        return <Text style={styles.loading}>Loading tasks...</Text>;
    }

    if (todos.length === 0) {
        return <Text style={styles.empty}>No tasks yet. Create one via + button!</Text>;
    }

    return (
        <FlatList
            data={todos}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            scrollEnabled={false} // Nested in ScrollView usually
        />
    );
}

const styles = StyleSheet.create({
    list: {
        paddingVertical: 8,
    },
    loading: {
        padding: 16,
        textAlign: 'center',
        color: '#666',
    },
    empty: {
        padding: 16,
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#007AFF',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checked: {
        backgroundColor: '#007AFF',
    },
    checkmark: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        color: '#333',
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    date: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    }
});
