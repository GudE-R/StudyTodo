import React, { useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { View, Text, StyleSheet, FlatList, ViewToken, TouchableOpacity } from 'react-native';
import { addDays, format, startOfDay, isSameDay, Locale } from 'date-fns';
import { useThemeColors, Colors } from '../../providers/ThemeProvider';
import { getDateFnsLocale } from '../../lib/date-fns-locales';
import { useTranslation } from 'react-i18next';
import { Todo, Category } from '@studytodo/shared';
import { useMobileTodos } from '../../hooks/useMobileTodos';
import { useMobileCategories } from '../../hooks/useMobileCategories';
import { calculateTopPosition, slotIndexToTimeStr, isHalfHourSlot } from '../../lib/scheduleUtils';

// ============================================================================
// Constants
// ============================================================================
const SLOT_HEIGHT = 27; // Height for 30 min slot
const SLOTS_PER_DAY = 48; // 24 hours * 2
const HEADER_HEIGHT = 30;
const TIME_LABEL_OFFSET = 15; // Offset to center time label on the line
const DAY_CONTENT_HEIGHT = SLOT_HEIGHT * SLOTS_PER_DAY;
const ITEM_HEIGHT = HEADER_HEIGHT + DAY_CONTENT_HEIGHT + TIME_LABEL_OFFSET; // Total height per day
const RANGE = 365; // ±365 days

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

type ThemeColors = typeof Colors.light;

interface DayItemProps {
    date: Date;
    colors: ThemeColors;
    locale: Locale;
    dateFormat: string;
    keptDate: Date | null;
    keptTime: string | null;
    onTimeLongPress?: (date: Date, time: string) => void;
    todos: Todo[];
    categoryMap: Map<string, string>;
}

// ============================================================================
// TimeSlot Component
// ============================================================================
const TimeSlot = memo(({
    slotIndex,
    isKept,
    colors,
    onLongPress
}: {
    slotIndex: number;
    isKept: boolean;
    colors: ThemeColors;
    onLongPress?: () => void;
}) => {
    const timeStr = slotIndexToTimeStr(slotIndex);
    const isHalfHour = isHalfHourSlot(slotIndex);

    return (
        <TouchableOpacity
            style={[styles.hourSlot, isKept && styles.keptSlot]}
            activeOpacity={1}
            onLongPress={onLongPress}
        >
            <View style={styles.hourLineContainer}>
                <Text
                    style={[styles.hourText, { color: colors.textMuted }, isKept && styles.keptText]}
                    testID={`time-label-${timeStr}`}
                >
                    {!isHalfHour || isKept ? timeStr : ''}
                </Text>
                <View
                    style={[
                        styles.hourLine,
                        isHalfHour
                            ? { borderBottomWidth: 1, borderStyle: 'dashed', borderColor: colors.border }
                            : { backgroundColor: colors.border, height: 1 }
                    ]}
                    testID={`hour-line-${timeStr}`}
                />
            </View>
        </TouchableOpacity>
    );
});

// ============================================================================
// CurrentTimeIndicator Component
// ============================================================================
const CurrentTimeIndicator = memo(() => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const top = calculateTopPosition(minutes, SLOT_HEIGHT, TIME_LABEL_OFFSET);

    return (
        <View style={[styles.currentTimeLine, { top }]}>
            <View style={styles.dot} />
            <View style={styles.line} />
        </View>
    );
});

// ============================================================================
// TaskBlock Component
// ============================================================================
const TaskBlock = memo(({ todo, top, height, color, onPress }: { todo: Todo, top: number, height: number, color: string, onPress?: () => void }) => {
    return (
        <TouchableOpacity
            style={[
                styles.taskBlock,
                { top, height, backgroundColor: color + 'cc', borderColor: color } // Add transparency
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text style={styles.taskTitle} numberOfLines={1}>
                {todo.title}
            </Text>
        </TouchableOpacity>
    );
});

// ============================================================================
// DayItem Component
// ============================================================================
const DayItem = memo(({
    date,
    colors,
    locale,
    dateFormat,
    keptDate,
    keptTime,
    onTimeLongPress,
    todos,
    categoryMap
}: DayItemProps) => {
    const isToday = isSameDay(date, new Date());

    // Pre-compute time slots
    const slots = useMemo(() => {
        return Array.from({ length: SLOTS_PER_DAY }, (_, slotIndex) => {
            const timeStr = slotIndexToTimeStr(slotIndex);
            const isKept = !!(keptTime === timeStr && keptDate && isSameDay(date, keptDate));
            return { slotIndex, isKept, timeStr };
        });
    }, [date, keptDate, keptTime]);

    // Compute task blocks
    const taskBlocks = useMemo(() => {
        return todos.map(todo => {
            if (!todo.dueTime) return null;
            const [h, m] = todo.dueTime.split(':').map(Number);
            const startMinutes = h * 60 + m;
            const top = calculateTopPosition(startMinutes, SLOT_HEIGHT, TIME_LABEL_OFFSET);

            let height = SLOT_HEIGHT; // Default 30 mins
            if (todo.endTime) {
                const [eh, em] = todo.endTime.split(':').map(Number);
                let endMinutes = eh * 60 + em;
                if (endMinutes < startMinutes) endMinutes += 24 * 60; // Handle midnight crossing
                const durationMinutes = endMinutes - startMinutes;
                height = (durationMinutes / 30) * SLOT_HEIGHT;
            } else {
                // Default to 15 mins (0.5 slot) if no end time
                height = SLOT_HEIGHT * 0.5;
            }

            // Min height
            height = Math.max(height, SLOT_HEIGHT / 2);

            const color = (todo.categoryId ? categoryMap.get(todo.categoryId) : null) || colors.primary;

            return (
                <TaskBlock
                    key={todo.id}
                    todo={todo}
                    top={top}
                    height={height}
                    color={color}
                />
            );
        });
    }, [todos, categoryMap, colors.primary]);

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

                {/* Task Overlays */}
                {taskBlocks}

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

    // Data Hooks
    const { todos, refreshTodos } = useMobileTodos();
    const { categories } = useMobileCategories();

    // Cache Category Colors
    const categoryMap = useMemo(() => {
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

    // Group todos by Date Key
    const todosByDate = useMemo(() => {
        const map = new Map<string, Todo[]>();
        todos.forEach(todo => {
            if (!todo.dueDate || todo.completed) return;

            const d = new Date(todo.dueDate);
            if (isNaN(d.getTime())) return;
            const key = format(d, 'yyyy-MM-dd');
            if (!map.has(key)) map.set(key, []);
            map.get(key)?.push(todo);
        });
        return map;
    }, [todos]);

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
    const getItemLayout = useCallback((_: unknown, index: number) => ({
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
    const renderItem = useCallback(({ item }: { item: Date }) => {
        const dateKey = format(item, 'yyyy-MM-dd');
        const dayTodos = todosByDate.get(dateKey) || [];

        return (
            <DayItem
                date={item}
                colors={colors}
                locale={locale}
                dateFormat={dateFormat}
                keptDate={keptDate}
                keptTime={keptTime}
                onTimeLongPress={onTimeLongPress}
                todos={dayTodos}
                categoryMap={categoryMap}
            />
        );
    }, [colors, locale, dateFormat, keptDate, keptTime, onTimeLongPress, todosByDate, categoryMap]);

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
        height: DAY_CONTENT_HEIGHT + TIME_LABEL_OFFSET,
        position: 'relative',
        paddingTop: TIME_LABEL_OFFSET,
    },
    hourSlot: {
        height: SLOT_HEIGHT,
        position: 'relative',
    },
    hourLineContainer: {
        position: 'absolute',
        top: -10, // Center on the line
        left: 0,
        right: 0,
        height: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    keptSlot: {
        backgroundColor: 'rgba(249, 115, 22, 0.1)', // Orange-ish tint
    },
    hourText: {
        width: 40,
        fontSize: 10,
        marginEnd: 10,
    },
    keptText: {
        fontWeight: 'bold',
        color: '#f97316',
    },
    hourLine: {
        flex: 1,
    },
    currentTimeLine: {
        position: 'absolute',
        left: 50, // Skip time text width
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444', // Red
        marginEnd: -4,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#ef4444',
    },
    // New Styles for Task Blocks
    taskBlock: {
        position: 'absolute',
        left: 60, // After time text and some padding
        right: 10,
        borderRadius: 4,
        borderLeftWidth: 3,
        padding: 2,
        justifyContent: 'center',
        zIndex: 5,
    },
    taskTitle: {
        fontSize: 10,
        color: '#fff',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    }
});
