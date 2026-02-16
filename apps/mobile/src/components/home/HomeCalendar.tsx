import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isSameMonth, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '../../providers/ThemeProvider';
import { useMobileTodos } from '../../hooks/useMobileTodos';
import { useMobileCategories } from '../../hooks/useMobileCategories';
import { Category } from '@studytodo/shared';

interface HomeCalendarProps {
    currentDate?: Date;
    onDateSelect?: (date: Date) => void;
    keptDate?: Date | null;
    onDateLongPress?: (date: Date) => void;
    viewMode?: 'month' | 'week';
}

import { getDateFnsLocale } from '../../lib/date-fns-locales';
import { useTranslation } from 'react-i18next';

export const HomeCalendar = ({ currentDate = new Date(), onDateSelect, keptDate, onDateLongPress, viewMode = 'month' }: HomeCalendarProps) => {
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

    // Track if navigation was initiated by user (to prevent useEffect override)
    const isUserNavigation = React.useRef(false);

    useEffect(() => {
        // Only sync if not a user-initiated navigation
        if (isUserNavigation.current) {
            isUserNavigation.current = false;
            return;
        }
        // In week mode, we want to follow current date if it changes drastically? 
        // Or if month changed.
        if (viewMode === 'month') {
            if (!isSameMonth(safeCurrentDate, viewingMonth)) {
                setViewingMonth(safeCurrentDate);
            }
        } else {
            // Week mode sync logic: check if safeCurrentDate is in viewing week?
            // For simplicity, just sync if significantly different
            // Actually, usually user selects date, so viewing should follow if needed.
            // let's stick to simple sync for now
            setViewingMonth(safeCurrentDate);
        }
    }, [safeCurrentDate, viewMode]); // Removing viewingMonth from deps to avoid loop if sync sets it

    const handlePrev = () => {
        isUserNavigation.current = true;
        if (viewMode === 'week') {
            const newDate = subWeeks(viewingMonth, 1);
            setViewingMonth(newDate);
            // Sync selected date with the new week's anchor date
            onDateSelect?.(newDate);
        } else {
            const newMonth = subMonths(viewingMonth, 1);
            setViewingMonth(newMonth);
            // Navigate to first day of new month
            onDateSelect?.(startOfMonth(newMonth));
        }
    };

    const handleNext = () => {
        isUserNavigation.current = true;
        if (viewMode === 'week') {
            const newDate = addWeeks(viewingMonth, 1);
            setViewingMonth(newDate);
            // Sync selected date with the new week's anchor date
            onDateSelect?.(newDate);
        } else {
            const newMonth = addMonths(viewingMonth, 1);
            setViewingMonth(newMonth);
            // Navigate to first day of new month
            onDateSelect?.(startOfMonth(newMonth));
        }
    };

    // Slide Animation
    const slideAnim = React.useRef(new Animated.Value(0)).current;
    const fadeAnim = React.useRef(new Animated.Value(1)).current;
    const prevMonthRef = React.useRef(viewingMonth);

    // Effect to trigger animation when viewingMonth changes
    useEffect(() => {
        let shouldAnimate = false;

        // Determine if we should animate based on viewMode
        if (viewMode === 'week') {
            // Only animate if the week changed
            if (!isSameWeek(prevMonthRef.current, viewingMonth, { locale })) {
                shouldAnimate = true;
            }
        } else {
            // Only animate if the month changed
            if (!isSameMonth(prevMonthRef.current, viewingMonth)) {
                shouldAnimate = true;
            }
        }

        if (shouldAnimate) {
            const isNext = viewingMonth > prevMonthRef.current;
            const width = 50; // Slide distance

            // Reset (in case it was mid-animation?)
            // Actually, we want to start from "off-screen" if this is a new render?
            // BUT wait, this component re-renders with new data.
            // So we need to:
            // 1. Start with offset (based on direction)
            // 2. Animate to 0

            slideAnim.setValue(isNext ? width : -width);
            fadeAnim.setValue(0);

            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.quad),
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }

        prevMonthRef.current = viewingMonth;
    }, [viewingMonth, viewMode, locale]);

    // Calculate Days to render
    const daysToRender = useMemo(() => {
        // ... (existing logic)
        if (viewMode === 'week') {
            const start = startOfWeek(viewingMonth, { locale });
            const end = endOfWeek(viewingMonth, { locale });
            return eachDayOfInterval({ start, end });
        } else {
            const monthStart = startOfMonth(viewingMonth);
            const monthEnd = endOfMonth(viewingMonth);
            const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
            const startDayOfWeek = monthStart.getDay();
            return Array.from({ length: startDayOfWeek }).fill(null).concat(days);
        }
    }, [viewingMonth, viewMode, locale]);


    // Create Category ID -> Color Map
    const categoryColorMap = useMemo(() => {
        const map = new Map<string, string>();
        const traverse = (cats: Category[]) => {
            cats.forEach(cat => {
                // Determine color: use cat.color
                if (cat.color) {
                    map.set(cat.id, cat.color);
                }
                if (cat.children) traverse(cat.children);
            });
        };
        traverse(categories);
        if (__DEV__) console.log('[HomeCalendar] Category Map Size:', map.size, 'Total Categories:', categories.length);
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

            let color = colors.primary; // Default
            if (todo.categoryId) {
                const catColor = categoryColorMap.get(todo.categoryId);
                if (catColor) {
                    color = catColor;
                } else {
                    // Category has no color or not yet loaded
                }
            }

            map.get(dateKey)?.add(color);
        });
        return map;
    }, [todos, categoryColorMap, colors.primary]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header only shown in month mode */}
            {viewMode === 'month' && (
                <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TouchableOpacity onPress={handlePrev} style={styles.navBtn}>
                        <ChevronLeft size={20} color={colors.icon} />
                    </TouchableOpacity>
                    <Text style={[styles.monthTitle, { color: colors.text }]}>
                        {format(viewingMonth, t('common.calendarTitleFormat', 'MMM yyyy'), { locale })}
                    </Text>
                    <TouchableOpacity onPress={handleNext} style={styles.navBtn}>
                        <ChevronRight size={20} color={colors.icon} />
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
                <Animated.View
                    style={[
                        styles.grid,
                        {
                            borderColor: colors.border,
                            opacity: fadeAnim,
                            transform: [{ translateX: slideAnim }]
                        }
                    ]}
                >
                    {['0', '1', '2', '3', '4', '5', '6'].map((key) => (
                        <View key={key} style={[styles.headerCell, { borderColor: colors.border }]}>
                            <Text style={[styles.headerText, { color: colors.textMuted }]}>{t(`common.weekdays.${key}`)}</Text>
                        </View>
                    ))}

                    {daysToRender.map((day: any, index) => {
                        if (!day) return <View key={`pad-${index}`} style={[styles.dayCell, { borderColor: colors.border }]} />;

                        const isSelected = isSameDay(day, safeCurrentDate);
                        const safeKeptDate = (keptDate instanceof Date && !isNaN(keptDate.getTime())) ? keptDate : null;
                        const isKept = safeKeptDate && isSameDay(day, safeKeptDate);

                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayColors = todosByDate.get(dateKey);
                        const dots = dayColors ? Array.from(dayColors).slice(0, 6) : []; // Max 6 dots now that we have space

                        return (
                            <TouchableOpacity
                                key={(day instanceof Date && !isNaN(day.getTime())) ? day.toISOString() : index.toString()}
                                style={[styles.dayCell, { borderColor: colors.border }]}
                                onPress={() => {
                                    onDateSelect?.(day);
                                    // Also move view to this day (important for week views)
                                    setViewingMonth(day);
                                }}
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
                </Animated.View>
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
        padding: 0,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
        borderTopWidth: 1,
        borderLeftWidth: 1,
    },
    headerCell: {
        width: '14.28%',
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderBottomWidth: 1,
    },
    headerText: {
        fontSize: 10,
    },
    dayCell: {
        width: '14.28%',
        height: 60,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 6,
        borderRightWidth: 1,
        borderBottomWidth: 1,
    },
    dateCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
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
        gap: 3,
        marginTop: 4,
        height: 6,
        flexWrap: 'wrap',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
});

