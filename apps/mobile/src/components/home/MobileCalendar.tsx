import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface MobileCalendarProps {
    currentDate?: Date;
    onDateSelect?: (date: Date) => void;
    keptDate?: Date | null;
    onDateLongPress?: (date: Date) => void;
}

export const MobileCalendar = ({ currentDate = new Date(), onDateSelect, keptDate, onDateLongPress }: MobileCalendarProps) => {
    // Validate currentDate to prevent RangeError
    const safeCurrentDate = (currentDate instanceof Date && !isNaN(currentDate.getTime())) ? currentDate : new Date();

    const [viewingMonth, setViewingMonth] = useState(safeCurrentDate);

    useEffect(() => {
        if (!isSameMonth(safeCurrentDate, viewingMonth)) {
            setViewingMonth(safeCurrentDate);
        }
    }, [safeCurrentDate]);

    const handlePrevMonth = () => {
        setViewingMonth(subMonths(viewingMonth, 1));
    };

    const handleNextMonth = () => {
        setViewingMonth(addMonths(viewingMonth, 1));
    };

    const monthStart = startOfMonth(viewingMonth);
    const monthEnd = endOfMonth(viewingMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startDayOfWeek = monthStart.getDay();
    const paddedDays = Array.from({ length: startDayOfWeek }).fill(null).concat(days);

    return (
        <View style={styles.container}>
            {/* Compact Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                    <ChevronLeft size={20} color="#555" />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>{format(viewingMonth, 'yyyy年 M月')}</Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                    <ChevronRight size={20} color="#555" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
                <View style={styles.grid}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <View key={i} style={styles.headerCell}>
                            <Text style={styles.headerText}>{d}</Text>
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
                                style={[styles.dayCell, isKept && styles.keptDayCell]}
                                onPress={() => onDateSelect?.(day)}
                                onLongPress={() => onDateLongPress?.(day)}
                            >
                                <View style={[styles.dateCircle, isSelected && styles.selectedDay, isKept && !isSelected && styles.keptDayCircle]}>
                                    <Text style={[
                                        styles.dayText,
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
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center', // Center navigation
        alignItems: 'center', // Reduced height
        paddingVertical: 4, // Minimal padding
        gap: 20,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
        backgroundColor: '#f8fafc',
    },
    navBtn: {
        padding: 2,
    },
    monthTitle: {
        fontSize: 14, // Smaller font
        fontWeight: 'bold',
        color: '#333',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 5, // Reduced padding
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
    },
    headerCell: {
        width: '14.28%',
        height: 20, // Reduced height
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 10,
        color: '#999',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateCircle: {
        width: 30, // Slightly smaller
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedDay: {
        backgroundColor: '#3b82f6',
    },
    dayText: {
        color: '#333',
        fontSize: 12, // Smaller font for days
    },
    selectedDayText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    keptDayCell: {
        // Option to highlight entire cell bg if needed
    },
    keptDayCircle: {
        borderWidth: 2,
        borderColor: '#f97316', // Orange border
        backgroundColor: '#fff',
    },
    keptDayText: {
        color: '#f97316',
        fontWeight: 'bold',
    }
});
