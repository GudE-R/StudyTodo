import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ViewToken, TouchableOpacity } from 'react-native';
import { addDays, format, startOfDay, isSameDay } from 'date-fns';

interface MobileDayScheduleProps {
    currentDate?: Date;
    onDateChange?: (date: Date) => void;
    keptDate?: Date | null;
    keptTime?: string | null;
    onTimeLongPress?: (date: Date, time: string) => void;
}

const SLOT_HEIGHT = 30;
const DAY_HEIGHT = SLOT_HEIGHT * 48;

export const MobileDaySchedule = ({ currentDate = new Date(), onDateChange, keptDate, keptTime, onTimeLongPress }: MobileDayScheduleProps) => {
    const listRef = useRef<FlatList>(null);
    const isProgrammaticScroll = useRef(false);

    // Range: -30 to +30 days
    // IMPORTANT: If we want real infinite scroll, we need windowing logic. 
    // For now, sticking to fixed range to avoid complexity in this step.
    const initialDate = useMemo(() => startOfDay(new Date()), []);
    const data = useMemo(() => {
        const days = [];
        for (let i = -30; i <= 30; i++) {
            days.push(addDays(initialDate, i));
        }
        return days;
    }, [initialDate]);

    // Initial load scroll
    useEffect(() => {
        // Find index of currentDate in data
        // For simplicity in this specialized -30/+30 list:
        // Index 30 is initialDate (today).
        // Difference in days = index - 30.

        // However, if currentDate changes from outside (Calendar/Header), we should scroll there.
        // We need to avoid loops: Scroll causes onDateChange -> Parent updates prop status -> useEffect scrolls again.

        if (isProgrammaticScroll.current) return;

        const diffTime = startOfDay(currentDate).getTime() - initialDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
        const index = diffDays + 30;

        if (index >= 0 && index < data.length) {
            // Scroll to that index without animation to feel instant for date selection
            // But if user is scrolling manually, we shouldn't interrupt?
            // Actually this prop update usually comes from User selecting Calendar.
            listRef.current?.scrollToIndex({ index, animated: true });
        }
    }, [currentDate, initialDate, data]);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            // Use the item responsible for the majority of view?
            // viewableItems[0] is typically the top one.
            const firstItem = viewableItems[0];
            const itemDate = firstItem.item as Date;

            if (firstItem.isViewable && onDateChange) {
                // To prevent loop when parent updates prop back to us:
                // We are setting isProgrammaticScroll = true before calling scrollTo from Prop.
                // But here we are the source.
                // We should ensure we don't re-trigger a scroll back to top if the user is scrolling down.

                // This logic is tricky. 
                // Simple approach: Check if date actually changed.
                // Check if the prop `currentDate` is already this date (ignoring time).

                // Note: We can't easily access the LATEST prop value inside this Ref callback without a Ref to props.
                // But we can trigger the change. The parent will update. 
                // The useEffect will see the new prop.
                // If the new prop matches the index we are mostly looking at, we should act carefully.

                isProgrammaticScroll.current = true; // Mark as "We caused this"
                onDateChange(itemDate);
                // Reset flag after render cycle? Or in useEffect?
                setTimeout(() => { isProgrammaticScroll.current = false; }, 500);
            }
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50 // Trigger when 50% of the day is visible
    }).current;

    const renderItem = ({ item }: { item: Date }) => (
        <View style={[styles.dayContainer, { height: DAY_HEIGHT }]}>
            <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{format(item, 'MMM d (EEE)')}</Text>
            </View>
            {/* Timeline Slots */}
            {Array.from({ length: 48 }).map((_, slotIndex) => {
                const hour = Math.floor(slotIndex / 2);
                const minutes = (slotIndex % 2) * 30;
                const timeStr = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
                const isHalfHour = minutes === 30;
                const isKept = keptTime === timeStr && keptDate && isSameDay(item, keptDate);

                return (
                    <TouchableOpacity
                        key={slotIndex}
                        style={[
                            styles.hourSlot,
                            { height: SLOT_HEIGHT },
                            isKept && styles.keptSlot,
                            isHalfHour && { borderBottomWidth: 0 } // Sub-line handled by different style if needed
                        ]}
                        activeOpacity={1}
                        onLongPress={() => onTimeLongPress?.(item, timeStr)}
                    >
                        <Text style={[styles.hourText, isKept && styles.keptText]}>
                            {!isHalfHour || isKept ? timeStr : ''}
                        </Text>
                        <View style={[
                            styles.hourLine,
                            isHalfHour && { backgroundColor: '#f9f9f9', height: 0.5 }
                        ]} />
                    </TouchableOpacity>
                );
            })}

            {/* Current Time Indicator (only if today) */}
            {isSameDay(item, new Date()) && (
                <CurrentTimeIndicator />
            )}
        </View>
    );

    const getItemLayout = (data: any, index: number) => ({
        length: DAY_HEIGHT,
        offset: DAY_HEIGHT * index,
        index,
    });

    const onScrollBeginDrag = () => {
        // User started scrolling manually
        isProgrammaticScroll.current = false;
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={listRef}
                data={data}
                renderItem={renderItem}
                keyExtractor={(item) => item.toISOString()}
                getItemLayout={getItemLayout}
                initialScrollIndex={30} // Today
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                onScrollBeginDrag={onScrollBeginDrag}
            />
        </View>
    );
};

const CurrentTimeIndicator = () => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const minutes = now.getHours() * 60 + now.getMinutes();
    const top = (minutes / 30) * SLOT_HEIGHT;

    return (
        <View style={[styles.currentTimeLine, { top }]}>
            <View style={styles.dot} />
            <View style={styles.line} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    dayContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#ccc'
    },
    dayHeader: {
        padding: 10,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    dayTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333',
    },
    hourSlot: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
    },
    hourText: {
        width: 50,
        textAlign: 'right',
        paddingRight: 10,
        color: '#888',
        fontSize: 12,
        top: -8,
    },
    hourLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#f0f0f0',
    },
    currentTimeLine: {
        position: 'absolute',
        left: 50,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'red',
        marginLeft: -4,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: 'red',
    },
    keptSlot: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)', // Blue-ish highlight
    },
    keptText: {
        color: '#3b82f6',
        fontWeight: 'bold',
    }
});
