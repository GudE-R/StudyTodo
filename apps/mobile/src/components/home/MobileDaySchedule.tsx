import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, SectionListData, ViewToken, TouchableOpacity } from 'react-native';
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
    const listRef = useRef<SectionList<Date, { title: Date }>>(null);
    const isProgrammaticScroll = useRef(false);

    // Range: -30 to +30 days
    // IMPORTANT: If we want real infinite scroll, we need windowing logic. 
    // For now, sticking to fixed range to avoid complexity in this step.
    const initialDate = useMemo(() => startOfDay(new Date()), []);
    const sections = useMemo(() => {
        const result = [];
        for (let i = -30; i <= 30; i++) {
            const date = addDays(initialDate, i);
            result.push({
                title: date,
                data: [date], // Each section has one item (the full day timeline)
            });
        }
        return result;
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

        if (index >= 0 && index < sections.length) {
            listRef.current?.scrollToLocation({
                sectionIndex: index,
                itemIndex: 0,
                animated: true,
                viewOffset: 0
            });
        }
    }, [currentDate, initialDate, sections]);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            const firstItem = viewableItems[0];
            // In SectionList, item might be null for headers, but my items are Dates.
            // SectionList ViewToken has `section` property.
            const itemDate = firstItem.item as Date | undefined;
            const section = firstItem.section as any;

            if (onDateChange) {
                const targetDate = itemDate || section?.title;
                if (!targetDate) return;

                isProgrammaticScroll.current = true;
                onDateChange(targetDate);
                setTimeout(() => { isProgrammaticScroll.current = false; }, 500);
            }
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50 // Trigger when 50% of the day is visible
    }).current;

    const renderSectionHeader = ({ section }: { section: SectionListData<Date, { title: Date }> }) => (
        <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>{format(section.title, 'MMM d (EEE)')}</Text>
        </View>
    );

    const renderItem = ({ item }: { item: Date }) => (
        <View style={[styles.dayContainer, { height: DAY_HEIGHT }]}>
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
                        ]}
                        activeOpacity={1}
                        onLongPress={() => onTimeLongPress?.(item, timeStr)}
                    >
                        <Text style={[styles.hourText, isKept && styles.keptText]}>
                            {!isHalfHour || isKept ? timeStr : ''}
                        </Text>
                        <View style={[
                            styles.hourLine,
                            isHalfHour ? {
                                // 3:30 slot -> This line is the 3:30 line (dashed)
                                backgroundColor: 'transparent',
                                borderBottomWidth: 1,
                                borderStyle: 'dashed',
                                borderColor: '#d0d0d0', // Slightly darker than before for visibility
                                height: 1,
                                top: 0,
                            } : {
                                // 3:00 slot -> This line is the 3:00 line (solid)
                                backgroundColor: '#bbb', // Darker for full hour
                                height: 1.5,
                                top: 0,
                            }
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


    const HEADER_HEIGHT = 44; // Estimated/Fixed height of header

    const getItemLayout = (data: any, index: number) => {
        // SectionList's internal FlatList sees: Header0, Item0, Header1, Item1, ...
        // Index 2n: Header
        // Index 2n+1: Item
        const sectionIndex = Math.floor(index / 2);
        const isHeader = index % 2 === 0;

        const offset = sectionIndex * (HEADER_HEIGHT + DAY_HEIGHT);

        return {
            length: isHeader ? HEADER_HEIGHT : DAY_HEIGHT,
            offset: isHeader ? offset : offset + HEADER_HEIGHT,
            index,
        };
    };

    const onScrollBeginDrag = () => {
        // User started scrolling manually
        isProgrammaticScroll.current = false;
    };

    return (
        <View style={styles.container}>
            <SectionList
                ref={listRef}
                sections={sections}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                keyExtractor={(item) => (item instanceof Date && !isNaN(item.getTime())) ? item.toISOString() : Math.random().toString()}
                stickySectionHeadersEnabled={true}
                initialNumToRender={5}
                getItemLayout={getItemLayout}
                onScrollToIndexFailed={(info) => {
                    console.log('Scroll failed', info);
                    listRef.current?.scrollToLocation({
                        sectionIndex: Math.floor(info.index / 2),
                        itemIndex: 0,
                        animated: false,
                    });
                }}
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
        height: 44,
        paddingHorizontal: 10,
        justifyContent: 'center',
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
        // borderBottomWidth removed to avoid overlap
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
        marginTop: 0, // Align closer to text top if needed
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
