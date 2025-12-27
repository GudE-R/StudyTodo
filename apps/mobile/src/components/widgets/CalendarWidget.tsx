
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Todo, Session } from '@pomarc/shared';
import { useThemeColors } from '../../hooks/useThemeColors';

interface CalendarWidgetProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    todos: Todo[];
    sessions: Session[];
}

export const CalendarWidget = ({ selectedDate, onSelectDate, todos, sessions }: CalendarWidgetProps) => {
    const { colors } = useThemeColors();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const hasActivity = (date: Date) => {
        return sessions.some(session => isSameDay(new Date(session.createdAt), date));
    };

    const hasTasks = (date: Date) => {
        return todos.some(todo => todo.dueDate && isSameDay(new Date(todo.dueDate), date));
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.monthTitle, { color: colors.text }]}>
                    {format(currentMonth, "yyyy年 M月", { locale: ja })}
                </Text>
                <View style={styles.navButtons}>
                    <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                        <ChevronLeft size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                        <ChevronRight size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Grid */}
            <View style={styles.grid}>
                {/* Weekday Labels */}
                <View style={styles.weekRow}>
                    {["日", "月", "火", "水", "木", "金", "土"].map((day, i) => (
                        <Text key={i} style={[styles.weekdayLabel, { color: colors.textMuted }]}>{day}</Text>
                    ))}
                </View>

                {/* Days */}
                <View style={styles.daysContainer}>
                    {days.map((day, idx) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isTodayDate = isToday(day);
                        const hasSession = hasActivity(day);
                        const hasToDo = hasTasks(day);

                        return (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => onSelectDate(day)}
                                style={[
                                    styles.dayCell,
                                    isSelected && { backgroundColor: colors.primary, shadowColor: colors.primary }
                                ]}
                            >
                                <Text style={[
                                    styles.dayText,
                                    { color: colors.text },
                                    !isCurrentMonth && { color: colors.border },
                                    isSelected && styles.selectedDayText,
                                    (isTodayDate && !isSelected) && { color: colors.primary }
                                ]}>
                                    {format(day, "d")}
                                </Text>

                                <View style={styles.dotsContainer}>
                                    {hasSession && <View style={[styles.dot, { backgroundColor: colors.success }, isSelected && styles.whiteDot]} />}
                                    {hasToDo && <View style={[styles.dot, { backgroundColor: colors.orange }, isSelected && styles.whiteDot]} />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        height: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 8,
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    navButtons: {
        flexDirection: 'row',
    },
    navBtn: {
        padding: 4,
    },
    grid: {
        flex: 1,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    weekdayLabel: {
        width: '14.28%',
        textAlign: 'center',
        fontSize: 12,
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
        borderRadius: 8,
    },
    dayText: {
        fontSize: 14,
    },
    selectedDayText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 4,
        height: 4,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    whiteDot: {
        backgroundColor: '#fff',
    },
});
