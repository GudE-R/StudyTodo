import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, SectionListData, ViewToken, TouchableOpacity } from 'react-native';
import { addDays, format, startOfDay, isSameDay } from 'date-fns';
import { useThemeColors } from '../../providers/ThemeProvider';

interface HomeDayScheduleProps {
    currentDate?: Date;
    onDateChange?: (date: Date) => void;
    keptDate?: Date | null;
    keptTime?: string | null;
    onTimeLongPress?: (date: Date, time: string) => void;
}

const SLOT_HEIGHT = 27;
const DAY_HEIGHT = SLOT_HEIGHT * 48;

import { getDateFnsLocale } from '../../lib/date-fns-locales';
import { useTranslation } from 'react-i18next';

export const HomeDaySchedule = ({ currentDate = new Date(), onDateChange, keptDate, keptTime, onTimeLongPress }: HomeDayScheduleProps) => {
    const { colors } = useThemeColors();
    const { t, i18n } = useTranslation();
    const locale = getDateFnsLocale(i18n.language);
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

    // Track whether a date change is coming from scroll
    const isScrollDateChange = useRef(false);
    const lastExternalDate = useRef(currentDate);

    // Initial load scroll and external date changes
    useEffect(() => {
        // Skip if the change came from our own scroll
        if (isScrollDateChange.current) {
            isScrollDateChange.current = false;
            return;
        }

        // Only scroll if the date actually changed from outside
        if (isSameDay(lastExternalDate.current, currentDate)) {
            return;
        }
        lastExternalDate.current = currentDate;

        const diffTime = startOfDay(currentDate).getTime() - initialDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
        const index = diffDays + 30;

        if (index >= 0 && index < sections.length) {
            isProgrammaticScroll.current = true;
            listRef.current?.scrollToLocation({
                sectionIndex: index,
                itemIndex: 0,
                animated: true,
                viewOffset: 0
            });
            // Reset the flag after animation completes
            setTimeout(() => { isProgrammaticScroll.current = false; }, 600);
        }
    }, [currentDate, initialDate, sections]);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        // Skip if this is a programmatic scroll (from useEffect)
        if (isProgrammaticScroll.current) return;

        if (viewableItems.length > 0) {
            const firstItem = viewableItems[0];
            const itemDate = firstItem.item as Date | undefined;
            const section = firstItem.section as any;

            if (onDateChange) {
                const targetDate = itemDate || section?.title;
                if (!targetDate) return;

                // Mark this as a scroll-initiated change to prevent useEffect from scrolling back
                isScrollDateChange.current = true;
                lastExternalDate.current = targetDate;
                onDateChange(targetDate);
            }
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50 // Trigger when 50% of the day is visible
    }).current;

    const renderSectionHeader = ({ section }: { section: SectionListData<Date, { title: Date }> }) => (
        <View style={[styles.dayHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.dayTitle, { color: colors.text }]}>
                {format(section.title, t('common.dateFormat', 'MMM d (EEE)'), { locale })}
            </Text>
        </View>
    );

    const renderItem = ({ item }: { item: Date }) => (
        <View style={[styles.dayContainer, { height: DAY_HEIGHT, backgroundColor: colors.background, borderColor: colors.border }]}>
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
                        <Text style={[styles.hourText, { color: colors.textMuted }, isKept && styles.keptText]}>
                            {!isHalfHour || isKept ? timeStr : ''}
                        </Text>
                        <View style={[
                            styles.hourLine,
                            isHalfHour ? {
                                backgroundColor: 'transparent',
                                borderBottomWidth: 1,
                                borderStyle: 'dashed',
                                borderColor: colors.border,
                                height: 1,
                                top: 0,
                            } : {
                                backgroundColor: colors.border,
                                height: 1.5,
                                top: 0,
                            }
                        ]} />
                    </TouchableOpacity>
                );
            })}

            {isSameDay(item, new Date()) && (
                <CurrentTimeIndicator />
            )}
        </View>
    );


    const HEADER_HEIGHT = 30; // Estimated/Fixed height of header

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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
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
    },
    dayContainer: {
        width: '100%',
        borderBottomWidth: 1,
    },
    dayHeader: {
        height: 30,
        paddingHorizontal: 10,
        justifyContent: 'center',
        borderBottomWidth: 1,
    },
    dayTitle: {
        fontWeight: '500',
        fontSize: 11,
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
        // top: -8 removed to prevent overlap with header
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
