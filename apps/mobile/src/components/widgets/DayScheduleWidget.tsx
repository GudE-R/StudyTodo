
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Todo } from '@pomarc/shared';
import { isSameDay, getHours, getMinutes } from 'date-fns';
import { useThemeColors } from '../../hooks/useThemeColors';

interface DayScheduleWidgetProps {
    todos: Todo[];
    selectedDate: Date;
}

export const DayScheduleWidget = ({ todos, selectedDate }: DayScheduleWidgetProps) => {
    const { colors } = useThemeColors();
    // Generate hours 0-24
    const hours = Array.from({ length: 25 }, (_, i) => i);
    const HOUR_HEIGHT = 40;

    const scheduledTodos = useMemo(() => {
        return todos.filter(todo => {
            if (!todo.dueDate) return false;
            return isSameDay(new Date(todo.dueDate), selectedDate);
        }).map(todo => {
            const date = new Date(todo.dueDate!);
            const startHour = getHours(date);
            const startMin = getMinutes(date);
            const top = (startHour + startMin / 60) * HOUR_HEIGHT;

            // Duration default 30 mins if not set
            const duration = todo.estimatedDuration || 30;
            const height = (duration / 60) * HOUR_HEIGHT;

            return { ...todo, top, height };
        });
    }, [todos, selectedDate]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background, borderLeftColor: colors.border }]}>
            <Text style={[styles.header, { color: colors.text, backgroundColor: colors.surface }]}>Schedule</Text>
            <ScrollView style={styles.scrollContainer} contentContainerStyle={{ height: 25 * HOUR_HEIGHT }}>
                {hours.map((hour) => (
                    <View key={hour} style={[styles.hourRow, { height: HOUR_HEIGHT, borderBottomColor: colors.surface }]}>
                        <Text style={[styles.timeLabel, { color: colors.textMuted }]}>{hour}</Text>
                        <View style={[styles.line, { backgroundColor: colors.border }]} />
                    </View>
                ))}

                {scheduledTodos.map(todo => (
                    <View
                        key={todo.id}
                        style={[
                            styles.eventBlock,
                            {
                                top: todo.top,
                                height: todo.height,
                                backgroundColor: todo.completed ? colors.surface : colors.primaryLight,
                                borderColor: todo.completed ? colors.border : colors.primary
                            }
                        ]}
                    >
                        <Text
                            style={[
                                styles.eventText,
                                { color: colors.primary },
                                todo.completed && { color: colors.textMuted }
                            ]}
                            numberOfLines={1}
                        >
                            {todo.title}
                        </Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        fontSize: 12,
        fontWeight: 'bold',
        padding: 8,
    },
    scrollContainer: {
        flex: 1,
    },
    hourRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
    },
    timeLabel: {
        width: 20,
        fontSize: 9,
        textAlign: 'right',
        marginRight: 4,
        marginTop: -5,
    },
    line: {
        flex: 1,
        height: 1,
    },
    eventBlock: {
        position: 'absolute',
        left: 28, // Offset from time labels
        right: 2,
        borderLeftWidth: 3,
        padding: 2,
        justifyContent: 'center',
        borderRadius: 2,
        overflow: 'hidden',
    },
    eventText: {
        fontSize: 9,
        fontWeight: 'bold',
    },
});
