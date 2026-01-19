import React, { useRef, useEffect, useState, useMemo, useCallback, memo } from 'react';
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
const HEADER_HEIGHT = 30;
const RANGE = 90; // 3 months before/after (reduced from 365 for performance)

import { getDateFnsLocale } from '../../lib/date-fns-locales';
import { useTranslation } from 'react-i18next';

// Memoized TimeSlot component to prevent unnecessary re-renders
const TimeSlot = memo(({
    slotIndex,
    isKept,
    onLongPress,
    colors
}: {
    slotIndex: number;
    isKept: boolean;
    onLongPress: () => void;
    colors: any;
}) => {
    const hour = Math.floor(slotIndex / 2);
    const minutes = (slotIndex % 2) * 30;
    const timeStr = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    const isHalfHour = minutes === 30;

    return (
        <TouchableOpacity
            style={[
                styles.hourSlot,
                { height: SLOT_HEIGHT },
                isKept && styles.keptSlot,
            ]}
            activeOpacity={1}
            onLongPress={onLongPress}
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
});

// Memoized CurrentTimeIndicator
const CurrentTimeIndicator = memo(() => {
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
});

export const HomeDaySchedule = ({ currentDate = new Date(), onDateChange, keptDate, keptTime, onTimeLongPress }: HomeDayScheduleProps) => {
    const { colors } = useThemeColors();
    const { t, i18n } = useTranslation();
    const locale = getDateFnsLocale(i18n.language);
    const listRef = useRef<SectionList<Date, { title: Date }>>(null);
    const isProgrammaticScroll = useRef(false);
    const isScrollDateChange = useRef(false);
    const lastExternalDate = useRef(currentDate);

    const initialDate = useMemo(() => startOfDay(new Date()), []);

    const sections = useMemo(() => {
        const result = [];
        for (let i = -RANGE; i <= RANGE; i++) {
            const date = addDays(initialDate, i);
            result.push({
                title: date,
                data: [date],
            });
        }
        return result;
    }, [initialDate]);

    // Stable viewability config (must not change between renders)
    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 10
    }).current;

    // getItemLayout for optimized scrolling (fixed heights)
    const getItemLayout = useCallback((data: any, index: number) => {
        const sectionIndex = Math.floor(index / 2);
        const isHeader = index % 2 === 0;
        const offset = sectionIndex * (HEADER_HEIGHT + DAY_HEIGHT);

        return {
            length: isHeader ? HEADER_HEIGHT : DAY_HEIGHT,
            offset: isHeader ? offset : offset + HEADER_HEIGHT,
            index,
        };
    }, []);

    // Initial scroll to today on mount
    useEffect(() => {
        const todayIndex = RANGE; // Today is always at index RANGE (middle of the list)

        // Small delay to ensure list is rendered
        const timer = setTimeout(() => {
            isProgrammaticScroll.current = true;
            listRef.current?.scrollToLocation({
                sectionIndex: todayIndex,
                itemIndex: 0,
                animated: false,
                viewOffset: 0
            });
            setTimeout(() => { isProgrammaticScroll.current = false; }, 100);
        }, 50);

        return () => clearTimeout(timer);
    }, []); // Empty deps = run once on mount

    // Handle external date changes (from Header arrows, Calendar clicks, etc.)
    useEffect(() => {
        if (isScrollDateChange.current) {
            isScrollDateChange.current = false;
            return;
        }

        if (isSameDay(lastExternalDate.current, currentDate)) {
            return;
        }
        lastExternalDate.current = currentDate;

        const diffTime = startOfDay(currentDate).getTime() - initialDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
        const index = diffDays + RANGE;

        if (index >= 0 && index < sections.length) {
            isProgrammaticScroll.current = true;
            listRef.current?.scrollToLocation({
                sectionIndex: index,
                itemIndex: 0,
                animated: true,
                viewOffset: 0
            });
            setTimeout(() => { isProgrammaticScroll.current = false; }, 600);
        }
    }, [currentDate, initialDate, sections]);

    const handleViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (isProgrammaticScroll.current) return;

        if (viewableItems.length > 0) {
            const firstItem = viewableItems[0];
            const itemDate = firstItem.item as Date | undefined;
            const section = firstItem.section as any;

            if (onDateChange) {
                const targetDate = itemDate || section?.title;
                if (!targetDate) return;

                isScrollDateChange.current = true;
                lastExternalDate.current = targetDate;
                onDateChange(targetDate);
            }
        }
    }, [onDateChange]);

    const onViewableItemsChangedRef = useRef(handleViewableItemsChanged);
    onViewableItemsChangedRef.current = handleViewableItemsChanged;

    const stableOnViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        onViewableItemsChangedRef.current({ viewableItems });
    }).current;

    const handleScrollBeginDrag = useCallback(() => {
        isProgrammaticScroll.current = false;
    }, []);

    const handleScrollToIndexFailed = useCallback((info: any) => {
        console.log('Scroll failed', info);
        listRef.current?.scrollToLocation({
            sectionIndex: Math.floor(info.index / 2),
            itemIndex: 0,
            animated: false,
        });
    }, []);

    const renderSectionHeader = useCallback(({ section }: { section: SectionListData<Date, { title: Date }> }) => (
        <View style={[styles.dayHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.dayTitle, { color: colors.text }]}>
                {format(section.title, t('common.dateFormat', 'MMM d (EEE)'), { locale })}
            </Text>
        </View>
    ), [colors, t, locale]);

    const renderItem = useCallback(({ item }: { item: Date }) => {
        const isToday = isSameDay(item, new Date());

        return (
            <View style={[styles.dayContainer, { height: DAY_HEIGHT, backgroundColor: colors.background, borderColor: colors.border }]}>
                {Array.from({ length: 48 }).map((_, slotIndex) => {
                    const hour = Math.floor(slotIndex / 2);
                    const minutes = (slotIndex % 2) * 30;
                    const timeStr = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
                    const isKept = !!(keptTime === timeStr && keptDate && isSameDay(item, keptDate));

                    return (
                        <TimeSlot
                            key={slotIndex}
                            slotIndex={slotIndex}
                            isKept={isKept}
                            onLongPress={() => onTimeLongPress?.(item, timeStr)}
                            colors={colors}
                        />
                    );
                })}
                {isToday && <CurrentTimeIndicator />}
            </View>
        );
    }, [colors, keptDate, keptTime, onTimeLongPress]);

    const keyExtractor = useCallback((item: Date) =>
        (item instanceof Date && !isNaN(item.getTime())) ? item.toISOString() : Math.random().toString()
        , []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SectionList
                ref={listRef}
                sections={sections}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                keyExtractor={keyExtractor}
                stickySectionHeadersEnabled={true}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                getItemLayout={getItemLayout}
                onScrollToIndexFailed={handleScrollToIndexFailed}
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={stableOnViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                onScrollBeginDrag={handleScrollBeginDrag}
                removeClippedSubviews={true}
            />
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
        height: HEADER_HEIGHT,
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
    },
    hourText: {
        width: 50,
        textAlign: 'right',
        paddingRight: 10,
        color: '#888',
        fontSize: 12,
    },
    hourLine: {
        flex: 1,
        marginTop: 0,
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
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    keptText: {
        color: '#3b82f6',
        fontWeight: 'bold',
    }
});
