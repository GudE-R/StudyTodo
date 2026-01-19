import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '../../providers/ThemeProvider';
import { useMobileTodos } from '../../hooks/useMobileTodos';
import { useMobileCategories } from '../../hooks/useMobileCategories';
import { Category } from '@pomarc/shared';

interface HomeCalendarProps {
    currentDate?: Date;
    onDateSelect?: (date: Date) => void;
    keptDate?: Date | null;
    onDateLongPress?: (date: Date) => void;
}

import { getDateFnsLocale } from '../../lib/date-fns-locales';
import { useTranslation } from 'react-i18next';

export const HomeCalendar = ({ currentDate = new Date(), onDateSelect, keptDate, onDateLongPress }: HomeCalendarProps) => {
    const { colors, isDark } = useThemeColors();
    const { t, i18n } = useTranslation();
    const locale = getDateFnsLocale(i18n.language);
    const { todos, refreshTodos } = useMobileTodos();
    const { categories } = useMobileCategories();

    useEffect(() => {
        refreshTodos();
    }, [refreshTodos]);

    const safeCurrentDate = (currentDate instanceof Date && !isNaN(currentDate.getTime())) ? currentDate : new Date();
    const [viewingMonth, setViewingMonth] = useState(safeCurrentDate);

    const handlePrevMonth = () => setViewingMonth(subMonths(viewingMonth, 1));
    const handleNextMonth = () => setViewingMonth(addMonths(viewingMonth, 1));

    const monthStart = startOfMonth(viewingMonth);
    const monthEnd = endOfMonth(viewingMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = monthStart.getDay();
    const paddedDays = Array.from({ length: startDayOfWeek }).fill(null).concat(days);

    // Create Category ID -> Color Map
    const categoryColorMap = useMemo(() => {
        const map = new Map<string, string>();
        const traverse = (cats: Category[]) => {
            cats.forEach(cat => {
                if (cat.color) map.set(cat.id, cat.color);
                if (cat.children) traverse(cat.children);
            });
        };
        traverse(categories);
        return map;
    }, [categories]);

    // Group todos by date
    const todosByDate = useMemo(() => {
        const map = new Map<string, Set<string>>(); // DateStr -> Set<Color>
        todos.forEach(todo => {
            if (!todo.dueDate || todo.completed) return;
            const date = new Date(todo.dueDate);
            if (isNaN(date.getTime())) return;
            const dateKey = format(date, 'yyyy-MM-dd');

            if (!map.has(dateKey)) map.set(dateKey, new Set());
            const color = todo.categoryId ? categoryColorMap.get(todo.categoryId) : null;
            if (color) map.get(dateKey)?.add(color);
            else map.get(dateKey)?.add(colors.primary); // Default color if no category color
        });
        return map;
    }, [todos, categoryColorMap, colors.primary]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                    <ChevronLeft size={20} color={colors.icon} />
                </TouchableOpacity>
                <Text style={[styles.monthTitle, { color: colors.text }]}>
                    {format(viewingMonth, t('common.calendarTitleFormat', 'MMM yyyy'), { locale })}
                </Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                    <ChevronRight size={20} color={colors.icon} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
                <View style={styles.grid}>
                    {['0', '1', '2', '3', '4', '5', '6'].map((key) => (
                        <View key={key} style={styles.headerCell}>
                            <Text style={[styles.headerText, { color: colors.textMuted }]}>{t(`common.weekdays.${key}`)}</Text>
                        </View>
                    ))}

                    {paddedDays.map((day: any, index) => {
                        if (!day) return <View key={`pad-${index}`} style={styles.dayCell} />;

                        const isSelected = isSameDay(day, safeCurrentDate);
                        const safeKeptDate = (keptDate instanceof Date && !isNaN(keptDate.getTime())) ? keptDate : null;
                        const isKept = safeKeptDate && isSameDay(day, safeKeptDate);

                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayColors = todosByDate.get(dateKey);
                        const dots = dayColors ? Array.from(dayColors).slice(0, 3) : []; // Max 3 dots

                        return (
                            <TouchableOpacity
                                key={(day instanceof Date && !isNaN(day.getTime())) ? day.toISOString() : index.toString()}
                                style={styles.dayCell}
                                onPress={() => onDateSelect?.(day)}
                                onLongPress={() => onDateLongPress?.(day)}
                            >
                                <View style={[
                                    styles.dateCircle,
                                    isSelected && styles.selectedDay,
                                    isKept && !isSelected && [styles.keptDayCircle, { backgroundColor: isDark ? colors.surface : '#fff' }]
                                ]}>
                                    <Text style={[
                                        styles.dayText,
                                        { color: colors.text },
                                        isSelected && styles.selectedDayText,
                                        isKept && !isSelected && styles.keptDayText
                                    ]}>
                                        {format(day, 'd')}
                                    </Text>
                                </View>
                                {/* Dots Container */}
                                <View style={styles.dotsContainer}>
                                    {dots.map((color, i) => (
                                        <View key={i} style={[styles.dot, { backgroundColor: color }]} />
                                    ))}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 4,
        gap: 20,
        borderBottomWidth: 1,
    },
    navBtn: {
        padding: 2,
    },
    monthTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
    },
    headerCell: {
        width: '14.28%',
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 10,
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedDay: {
        backgroundColor: '#3b82f6',
    },
    dayText: {
        fontSize: 12,
    },
    selectedDayText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    keptDayCircle: {
        borderWidth: 2,
        borderColor: '#f97316',
    },
    keptDayText: {
        color: '#f97316',
        fontWeight: 'bold',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 2,
        marginTop: 2,
        height: 6,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
});

