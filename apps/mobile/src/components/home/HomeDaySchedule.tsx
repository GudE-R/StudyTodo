import React, { useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { View, Text, StyleSheet, FlatList, ViewToken, TouchableOpacity } from 'react-native';
import { addDays, format, startOfDay, isSameDay } from 'date-fns';
import { useThemeColors } from '../../providers/ThemeProvider';
import { getDateFnsLocale } from '../../lib/date-fns-locales';
import { useTranslation } from 'react-i18next';

// ============================================================================
// Constants
// ============================================================================
const SLOT_HEIGHT = 27;
const SLOTS_PER_DAY = 48;
const HEADER_HEIGHT = 30;
const DAY_CONTENT_HEIGHT = SLOT_HEIGHT * SLOTS_PER_DAY;
const ITEM_HEIGHT = HEADER_HEIGHT + DAY_CONTENT_HEIGHT; // Total height per day
const RANGE = 365; // ±365 days (731 total items, ~2 years)

// ============================================================================
// Types
// ============================================================================
interface HomeDayScheduleProps {
    currentDate?: Date;
    onDateChange?: (date: Date) => void;
    keptDate?: Date | null;
    keptTime?: string | null;
    onTimeLongPress?: (date: Date, time: string) => void;
}

interface DayItemProps {
    date: Date;
    colors: any;
    locale: any;
    dateFormat: string;
    keptDate: Date | null;
    keptTime: string | null;
    onTimeLongPress?: (date: Date, time: string) => void;
}

// ============================================================================
// TimeSlot Component (Memoized)
// ============================================================================
const TimeSlot = memo(({
    slotIndex,
    isKept,
    colors,
    onLongPress
}: {
    slotIndex: number;
    isKept: boolean;
    colors: any;
    onLongPress?: () => void;
}) => {
    const hour = Math.floor(slotIndex / 2);
    const minutes = (slotIndex % 2) * 30;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const isHalfHour = minutes === 30;

    return (
        <TouchableOpacity
            style={[styles.hourSlot, isKept && styles.keptSlot]}
            activeOpacity={1}
            onLongPress={onLongPress}
        >
            <Text style={[styles.hourText, { color: colors.textMuted }, isKept && styles.keptText]}>
                {!isHalfHour || isKept ? timeStr : ''}
            </Text>
            <View
                style={[
                    styles.hourLine,
                    isHalfHour
                        ? { borderBottomWidth: 1, borderStyle: 'dashed', borderColor: colors.border }
                        : { backgroundColor: colors.border, height: 1.5 }
                ]}
            />
        </TouchableOpacity>
    );
});

// ============================================================================
// CurrentTimeIndicator Component (Memoized)
// ============================================================================
const CurrentTimeIndicator = memo(() => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const top = (minutes / 30) * SLOT_HEIGHT;

    return (
        <View style={[styles.currentTimeLine, { top }]}>
            <View style={styles.dot} />
            <View style={styles.line} />
        </View>
    );
});

// ============================================================================
// DayItem Component (Memoized)
// ============================================================================
const DayItem = memo(({
    date,
    colors,
    locale,
    dateFormat,
    keptDate,
    keptTime,
    onTimeLongPress
}: DayItemProps) => {
    const isToday = isSameDay(date, new Date());

    // Pre-compute time slots
    const slots = useMemo(() => {
        return Array.from({ length: SLOTS_PER_DAY }, (_, slotIndex) => {
            const hour = Math.floor(slotIndex / 2);
            const minutes = (slotIndex % 2) * 30;
            const timeStr = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            const isKept = !!(keptTime === timeStr && keptDate && isSameDay(date, keptDate));
            return { slotIndex, isKept, timeStr };
        });
    }, [date, keptDate, keptTime]);

    return (
        <View style={{ height: ITEM_HEIGHT }}>
            {/* Day Header */}
            <View style={[styles.dayHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.dayTitle, { color: colors.text }]}>
                    {format(date, dateFormat, { locale })}
                </Text>
            </View>

            {/* Time Slots */}
            <View style={[styles.dayContent, { backgroundColor: colors.background }]}>
                {slots.map(({ slotIndex, isKept, timeStr }) => (
                    <TimeSlot
                        key={slotIndex}
                        slotIndex={slotIndex}
                        isKept={isKept}
                        colors={colors}
                        onLongPress={() => onTimeLongPress?.(date, timeStr)}
                    />
                ))}

                {/* Current Time Indicator */}
                {isToday && <CurrentTimeIndicator />}
            </View>
        </View>
    );
});

// ============================================================================
// Main Component
// ============================================================================
export const HomeDaySchedule = ({
    currentDate = new Date(),
    onDateChange,
    keptDate = null,
    keptTime = null,
    onTimeLongPress
}: HomeDayScheduleProps) => {
    const { colors } = useThemeColors();
    const { t, i18n } = useTranslation();
    const locale = getDateFnsLocale(i18n.language);
    const dateFormat = t('common.dateFormat', 'MMM d (EEE)');

    const listRef = useRef<FlatList<Date>>(null);
    const isProgrammaticScroll = useRef(false);
    const isScrollDateChange = useRef(false);
    const lastExternalDate = useRef(currentDate);

    // Generate days array centered on today
    const today = useMemo(() => startOfDay(new Date()), []);
    const days = useMemo(() => {
        return Array.from({ length: RANGE * 2 + 1 }, (_, i) => addDays(today, i - RANGE));
    }, [today]);

    // Stable viewability config
    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 20,
        minimumViewTime: 100
    }).current;

    // getItemLayout for optimized scrolling
    const getItemLayout = useCallback((_: any, index: number) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
    }), []);

    // Handle external date changes (from Calendar, Header arrows)
    useEffect(() => {
        if (isScrollDateChange.current) {
            isScrollDateChange.current = false;
            return;
        }

        if (isSameDay(lastExternalDate.current, currentDate)) {
            return;
        }
        lastExternalDate.current = currentDate;

        // Calculate target index
        const diffTime = startOfDay(currentDate).getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const targetIndex = diffDays + RANGE;

        if (targetIndex >= 0 && targetIndex < days.length) {
            isProgrammaticScroll.current = true;
            listRef.current?.scrollToIndex({
                index: targetIndex,
                animated: true
            });
            setTimeout(() => { isProgrammaticScroll.current = false; }, 500);
        }
    }, [currentDate, today, days.length]);

    // Handle viewable items change (scroll sync)
    const handleViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (isProgrammaticScroll.current) return;
        if (viewableItems.length === 0) return;

        const firstVisible = viewableItems[0];
        const visibleDate = firstVisible.item as Date;

        if (visibleDate && onDateChange) {
            isScrollDateChange.current = true;
            lastExternalDate.current = visibleDate;
            onDateChange(visibleDate);
        }
    }, [onDateChange]);

    // Stable callback ref pattern
    const viewableItemsChangedRef = useRef(handleViewableItemsChanged);
    viewableItemsChangedRef.current = handleViewableItemsChanged;

    const stableOnViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        viewableItemsChangedRef.current({ viewableItems });
    }).current;

    // Scroll begin handler
    const handleScrollBeginDrag = useCallback(() => {
        isProgrammaticScroll.current = false;
    }, []);

    // Render item
    const renderItem = useCallback(({ item }: { item: Date }) => (
        <DayItem
            date={item}
            colors={colors}
            locale={locale}
            dateFormat={dateFormat}
            keptDate={keptDate}
            keptTime={keptTime}
            onTimeLongPress={onTimeLongPress}
        />
    ), [colors, locale, dateFormat, keptDate, keptTime, onTimeLongPress]);

    // Key extractor
    const keyExtractor = useCallback((item: Date) => item.toISOString(), []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                ref={listRef}
                data={days}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                getItemLayout={getItemLayout}
                initialScrollIndex={RANGE}
                onViewableItemsChanged={stableOnViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                onScrollBeginDrag={handleScrollBeginDrag}
                windowSize={5}
                maxToRenderPerBatch={3}
                initialNumToRender={3}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={false}
            />
        </View>
    );
};

// ============================================================================
// Styles
// ============================================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    dayContent: {
        height: DAY_CONTENT_HEIGHT,
        position: 'relative',
    },
    hourSlot: {
        height: SLOT_HEIGHT,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    hourText: {
        width: 50,
        textAlign: 'right',
        paddingRight: 10,
        fontSize: 12,
    },
    hourLine: {
        flex: 1,
        height: 1,
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
    },
});
