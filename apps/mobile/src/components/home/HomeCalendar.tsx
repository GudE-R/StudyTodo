import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '../../providers/ThemeProvider';

interface HomeCalendarProps {
    currentDate?: Date;
    onDateSelect?: (date: Date) => void;
    keptDate?: Date | null;
    onDateLongPress?: (date: Date) => void;
}

export const HomeCalendar = ({ currentDate = new Date(), onDateSelect, keptDate, onDateLongPress }: HomeCalendarProps) => {
    const { colors, isDark } = useThemeColors();
    const safeCurrentDate = (currentDate instanceof Date && !isNaN(currentDate.getTime())) ? currentDate : new Date();
    const [viewingMonth, setViewingMonth] = useState(safeCurrentDate);

    const handlePrevMonth = () => setViewingMonth(subMonths(viewingMonth, 1));
    const handleNextMonth = () => setViewingMonth(addMonths(viewingMonth, 1));

    const monthStart = startOfMonth(viewingMonth);
    const monthEnd = endOfMonth(viewingMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = monthStart.getDay();
    const paddedDays = Array.from({ length: startDayOfWeek }).fill(null).concat(days);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                    <ChevronLeft size={20} color={colors.icon} />
                </TouchableOpacity>
                <Text style={[styles.monthTitle, { color: colors.text }]}>{format(viewingMonth, 'yyyy年 M月')}</Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                    <ChevronRight size={20} color={colors.icon} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
                <View style={styles.grid}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <View key={i} style={styles.headerCell}>
                            <Text style={[styles.headerText, { color: colors.textMuted }]}>{d}</Text>
                        </View>
                    ))}

                    {paddedDays.map((day: any, index) => {
                        if (!day) return <View key={`pad-${index}`} style={styles.dayCell} />;

                        const isSelected = isSameDay(day, safeCurrentDate);
                        const safeKeptDate = (keptDate instanceof Date && !isNaN(keptDate.getTime())) ? keptDate : null;
                        const isKept = safeKeptDate && isSameDay(day, safeKeptDate);

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
    }
});

