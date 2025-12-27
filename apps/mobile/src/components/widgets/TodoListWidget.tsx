
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Todo } from '@pomarc/shared';
import { isSameDay, format } from 'date-fns';
import { Check, Clock, Play } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

interface TodoListWidgetProps {
    todos: Todo[];
    selectedDate: Date;
    onToggleTodo: (id: string, completed: boolean) => void;
    onPlayTodo: (todo: Todo) => void;
}

export const TodoListWidget = ({ todos, selectedDate, onToggleTodo, onPlayTodo }: TodoListWidgetProps) => {
    const { colors } = useThemeColors();

    const filteredTodos = useMemo(() => {
        return todos.filter(todo => {
            if (!todo.dueDate) return false;
            return isSameDay(new Date(todo.dueDate), selectedDate);
        }).sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            /* @ts-ignore */
            if (headerPriority(a.priority) !== headerPriority(b.priority))
                return headerPriority(a.priority) - headerPriority(b.priority);
            return new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();
        });
    }, [todos, selectedDate]);

    const headerPriority = (p: string | undefined) => {
        if (p === 'high') return 0;
        if (p === 'medium') return 1;
        return 2;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <Text style={[styles.header, { color: colors.text }]}>
                Tasks ({format(selectedDate, 'M/d')})
            </Text>
            <ScrollView style={styles.list}>
                {filteredTodos.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No tasks</Text>
                ) : (
                    filteredTodos.map((todo) => (
                        <View key={todo.id} style={[
                            styles.card,
                            { backgroundColor: colors.background, borderColor: colors.border },
                            todo.completed && { backgroundColor: colors.surface, borderColor: colors.surface }
                        ]}>
                            <View style={[styles.priorityIndicator,
                            todo.priority === 'high' ? { backgroundColor: colors.danger } :
                                todo.priority === 'medium' ? { backgroundColor: colors.primary } : { backgroundColor: colors.icon }
                            ]} />

                            <TouchableOpacity
                                style={[styles.checkbox, { borderColor: colors.icon }]}
                                onPress={() => onToggleTodo(todo.id, !todo.completed)}
                            >
                                {todo.completed && <Check size={12} color={colors.text} />}
                            </TouchableOpacity>

                            <View style={styles.content}>
                                <Text
                                    style={[
                                        styles.title,
                                        { color: colors.text },
                                        todo.completed && { color: colors.textMuted, textDecorationLine: 'line-through' }
                                    ]}
                                    numberOfLines={2}
                                >
                                    {todo.title}
                                </Text>
                                {todo.dueDate && (
                                    <View style={styles.metaRow}>
                                        <Clock size={10} color={colors.textSecondary} />
                                        <Text style={[styles.due, { color: colors.textSecondary }]}>
                                            {format(new Date(todo.dueDate), 'HH:mm')}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Play Button */}
                            {!todo.completed && (
                                <TouchableOpacity
                                    style={[styles.playBtn, { backgroundColor: colors.surfaceHighlight }]}
                                    onPress={() => onPlayTodo(todo)}
                                >
                                    <Play size={12} color={colors.primary} fill={colors.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 4,
    },
    header: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    list: {
        flex: 1,
    },
    emptyText: {
        fontSize: 12,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20,
    },
    card: {
        borderRadius: 4,
        marginBottom: 4,
        flexDirection: 'row',
        padding: 6,
        alignItems: 'center',
        borderWidth: 1,
    },
    priorityIndicator: {
        width: 3,
        height: '100%',
        borderRadius: 2,
        marginRight: 8,
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
    },
    checkbox: {
        width: 16,
        height: 16,
        borderRadius: 4,
        borderWidth: 1,
        marginRight: 8,
        marginLeft: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 16,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    due: {
        fontSize: 10,
    },
    playBtn: {
        padding: 6,
        borderRadius: 12,
        marginLeft: 4,
    },
});
