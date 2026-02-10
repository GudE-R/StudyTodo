import React, { useState, useRef, useEffect } from 'react';
import { startOfMonth, getDaysInMonth } from 'date-fns';
import { View, StyleSheet, PanResponder, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdBanner } from './AdBanner';
import { Footer } from './Footer';
import { HomeTodoList } from '../home/HomeTodoList';
import { HomeDaySchedule } from '../home/HomeDaySchedule';
import { HomeCalendar } from '../home/HomeCalendar';

// Modals
import { TodoCreateModal } from '../modals/TodoCreateModal';
import { TodoDetailModal } from '../modals/TodoDetailModal';
import { SettingsModal } from '../modals/SettingsModal';
import { TemplateModal } from '../modals/TemplateModal';
import { ActivityModal } from '../modals/ActivityModal';
import { FeedbackModal } from '../modals/FeedbackModal';
import { UsageGuideModal } from '../modals/UsageGuideModal';
import { MobileTimerView } from '../timer/MobileTimerView';
import { MenuModal } from '../modals/MenuModal';

import { useMobileCategories } from '../../hooks/useMobileCategories';
import { useMobileTodos } from '../../hooks/useMobileTodos';
import { useMobileSessions } from '../../hooks/useMobileSessions';
import { useMobileSRS } from '../../hooks/useMobileSRS';
import { useThemeColors } from '../../providers/ThemeProvider';
import { Todo, generateId } from '@studytodo/shared';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const MainLayoutSimple = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { categories, refreshCategories } = useMobileCategories();
    const { addTodo, updateTodo, deleteTodo, applySrsToExistingTodo } = useMobileTodos();
    const { addSession } = useMobileSessions();
    const { profiles: srsProfiles } = useMobileSRS();
    const { colors } = useThemeColors();

    const [viewMode, setViewMode] = useState<"home" | "timer">("home");
    const [activeTodo, setActiveTodo] = useState<Todo | null>(null);

    // Keep State
    const [keptDate, setKeptDate] = useState<Date | null>(null);
    const [keptTime, setKeptTime] = useState<string | null>(null);

    // Modal States
    const [isTodoModalVisible, setTodoModalVisible] = useState(false);
    const [isDetailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
    const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
    const [isTemplateModalVisible, setTemplateModalVisible] = useState(false);
    const [isActivityModalVisible, setActivityModalVisible] = useState(false);
    const [isFeedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [isGuideModalVisible, setGuideModalVisible] = useState(false);
    const [isMenuModalVisible, setMenuModalVisible] = useState(false);

    // Calendar Mode (week / month)
    const [calendarMode, setCalendarMode] = useState<'week' | 'month'>('week');

    // Schedule expand mode
    const [scheduleExpanded, setScheduleExpanded] = useState(false);

    // Animated height for smooth transitions
    const calendarHeight = useRef(new Animated.Value(100)).current;
    // Animated horizontal slide for week navigation
    const calendarTranslateX = useRef(new Animated.Value(0)).current;
    // Animated flex for schedule pane (default 7.5:2.5, expanded 4:6)
    const todoFlex = useRef(new Animated.Value(7.5)).current;
    const scheduleFlex = useRef(new Animated.Value(2.5)).current;

    // Animate schedule width when expanded mode changes
    useEffect(() => {
        Animated.parallel([
            Animated.spring(todoFlex, {
                toValue: scheduleExpanded ? 4 : 7.5,
                friction: 10,
                tension: 40,
                useNativeDriver: false,
            }),
            Animated.spring(scheduleFlex, {
                toValue: scheduleExpanded ? 6 : 2.5,
                friction: 10,
                tension: 40,
                useNativeDriver: false,
            }),
        ]).start();
    }, [scheduleExpanded]);

    // Animate calendar height when mode changes
    useEffect(() => {
        let targetHeight = 85; // Default week height (24 header + 60 row + 1 border)

        if (calendarMode === 'month') {
            const startDay = startOfMonth(currentDate).getDay(); // 0(Sun) - 6(Sat)
            const daysInMonth = getDaysInMonth(currentDate);
            const totalSlots = startDay + daysInMonth;
            const rows = Math.ceil(totalSlots / 7);

            // Header (34) + WeekdayHeader (24) + Rows * 60 + Borders(2)
            // Header is roughly 34px (padding 4+4 + icon 20 + text + border 1)
            // Weekday is 24px
            // Row is 60px
            // let's try 58 + rows * 60 for tight fit
            targetHeight = 58 + (rows * 60);
        }

        Animated.spring(calendarHeight, {
            toValue: targetHeight,
            friction: 12,
            tension: 40,
            useNativeDriver: false,
        }).start();
    }, [calendarMode, currentDate]);

    // Week navigation with slide animation
    const navigateWeek = (direction: 'next' | 'prev') => {
        const slideOut = direction === 'next' ? -300 : 300;
        const slideIn = direction === 'next' ? 300 : -300;

        // Slide out
        Animated.timing(calendarTranslateX, {
            toValue: slideOut,
            duration: 150,
            useNativeDriver: false, // Must match height animation
        }).start(() => {
            // Change date
            setCurrentDate(d => {
                const newDate = new Date(d);
                newDate.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
                return newDate;
            });

            // Reset to opposite side instantly
            calendarTranslateX.setValue(slideIn);

            // Slide in
            Animated.spring(calendarTranslateX, {
                toValue: 0,
                friction: 8,
                tension: 50,
                useNativeDriver: false, // Must match height animation
            }).start();
        });
    };

    // PanResponder for Calendar Swipe
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Respond to significant vertical OR horizontal gestures
                return Math.abs(gestureState.dy) > 10 || Math.abs(gestureState.dx) > 10;
            },
            onPanResponderRelease: (_, gestureState) => {
                // Vertical swipes: toggle calendar mode
                if (Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
                    if (gestureState.dy > 50) {
                        // Swipe Down -> Expand to Month
                        setCalendarMode('month');
                    } else if (gestureState.dy < -50) {
                        // Swipe Up -> Collapse to Week
                        setCalendarMode('week');
                    }
                } else {
                    // Horizontal swipes: navigate weeks or months based on mode
                    if (gestureState.dx < -50) {
                        if (calendarMode === 'week') {
                            navigateWeek('next');
                        } else {
                            // Month mode: navigate to next month
                            setCurrentDate(d => {
                                const newDate = new Date(d);
                                newDate.setMonth(d.getMonth() + 1);
                                return newDate;
                            });
                        }
                    } else if (gestureState.dx > 50) {
                        if (calendarMode === 'week') {
                            navigateWeek('prev');
                        } else {
                            // Month mode: navigate to previous month
                            setCurrentDate(d => {
                                const newDate = new Date(d);
                                newDate.setMonth(d.getMonth() - 1);
                                return newDate;
                            });
                        }
                    }
                }
            },
        })
    ).current;

    // Keep Handlers
    const handleDateLongPress = (date: Date) => {
        if (keptDate && date.getTime() === keptDate.getTime()) {
            setKeptDate(null);
        } else {
            setKeptDate(date);
        }
    };

    const handleTimeLongPress = (date: Date, time: string) => {
        if (keptTime === time && keptDate && date.getTime() === keptDate.getTime()) {
            setKeptTime(null);
            setKeptDate(null);
        } else {
            setKeptTime(time);
            setKeptDate(date);
        }
    };

    const handleResetKeep = () => {
        setKeptDate(null);
        setKeptTime(null);
    };

    const handleStartNow = async (todoData: Omit<Todo, "id" | "createdAt" | "completed">) => {
        const newTodo: Todo = {
            ...todoData,
            id: generateId(),
            createdAt: new Date(),
            completed: false,
        };
        await addTodo(newTodo);
        setActiveTodo(newTodo);
        setViewMode("timer");
        setTodoModalVisible(false);
    };

    const handleTodoPress = (todo: Todo) => {
        setSelectedTodo(todo);
        setDetailModalVisible(true);
    };

    const handleTodoStartNow = (todo: Todo) => {
        setActiveTodo(todo);
        setViewMode("timer");
    };

    const handleTodoUpdate = async (todo: Todo, options?: { applySrs?: boolean }) => {
        await updateTodo(todo.id, todo);

        // SRS Generation Logic
        if (options?.applySrs && todo.srsInterval) {
            const profile = srsProfiles.find(p => p.name === todo.srsInterval);
            if (profile) {
                await applySrsToExistingTodo(todo, profile.intervals);
            }
        }
    };

    const handleTodoDelete = async (todoId: string) => {
        await deleteTodo(todoId);
    };

    const handleTodoRecord = async (todo: Todo, duration: number) => {
        await updateTodo(todo.id, { ...todo, completed: true });
        await addSession({
            id: generateId(),
            todoId: todo.id,
            todoTitle: todo.title,
            duration: duration,
            mode: 'pomodoro',
            createdAt: new Date(),
        });
    };

    if (viewMode === "timer" && activeTodo) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <MobileTimerView
                    todo={activeTodo}
                    onBack={() => {
                        setViewMode("home");
                        setActiveTodo(null);
                    }}
                    onSaveSession={async (data) => {
                        await addSession({
                            id: generateId(),
                            todoId: data.todoId,
                            todoTitle: data.todoTitle,
                            duration: data.duration,
                            mode: data.mode as "pomodoro" | "stopwatch" | "countdown",
                            createdAt: new Date(),
                        });
                    }}
                    onCompleteTask={async () => {
                        await updateTodo(activeTodo.id, { ...activeTodo, completed: true });
                        setViewMode("home");
                        setActiveTodo(null);
                    }}
                />
            </SafeAreaView>
        );
    }

    // PanResponder for Schedule Pane
    const schedulePanResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 20,
            onPanResponderRelease: (_, gs) => {
                if (gs.dx < -50) {
                    // Swipe Left -> Expand schedule
                    setScheduleExpanded(true);
                } else if (gs.dx > 50) {
                    // Swipe Right -> Collapse schedule
                    setScheduleExpanded(false);
                }
            },
        })
    ).current;

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <AdBanner />

            {/* Expandable Calendar Area (NO HEADER) */}
            <Animated.View
                style={[
                    styles.calendarContainer,
                    {
                        borderColor: colors.border,
                        height: calendarHeight,
                        transform: [{ translateX: calendarTranslateX }]
                    }
                ]}
                {...panResponder.panHandlers}
            >
                <HomeCalendar
                    currentDate={currentDate}
                    onDateSelect={setCurrentDate}
                    keptDate={keptDate}
                    onDateLongPress={(date) => handleDateLongPress(date)}
                    viewMode={calendarMode}
                />
            </Animated.View>

            {/* Main Content: Split View */}
            <View style={[styles.mainContent, { backgroundColor: colors.background }]}>
                <View style={styles.splitRow}>
                    {/* Todo List */}
                    <Animated.View style={[styles.todoPane, { borderColor: colors.border, flex: todoFlex }]}>
                        <HomeTodoList date={currentDate} onTodoPress={handleTodoPress} />
                    </Animated.View>

                    {/* Schedule Pane - Swipe left to expand, right to collapse */}
                    <Animated.View
                        style={[styles.schedulePane, { borderColor: colors.border, flex: scheduleFlex }]}
                        {...schedulePanResponder.panHandlers}
                    >

                        <HomeDaySchedule
                            currentDate={currentDate}
                            onDateChange={setCurrentDate}
                            keptDate={keptDate}
                            keptTime={keptTime}
                            onTimeLongPress={(date, time) => handleTimeLongPress(date, time)}
                        />
                    </Animated.View>
                </View>
            </View>

            <Footer
                onOpenTemplate={() => setTemplateModalVisible(true)}
                onOpenTodo={() => setTodoModalVisible(true)}
                onOpenReport={() => setActivityModalVisible(true)}
                onOpenMenu={() => setMenuModalVisible(true)}
                isHighlighted={!!keptDate || !!keptTime}
                onResetKeep={handleResetKeep}
            />

            {/* Modals */}
            <TodoCreateModal
                visible={isTodoModalVisible}
                onClose={() => setTodoModalVisible(false)}
                categories={categories}
                initialDate={keptDate || undefined}
                initialTime={keptTime || undefined}
                onStartNow={handleStartNow}
            />

            <MenuModal
                visible={isMenuModalVisible}
                onClose={() => setMenuModalVisible(false)}
                onOpenSettings={() => setSettingsModalVisible(true)}
                onOpenFeedback={() => setFeedbackModalVisible(true)}
                onOpenGuide={() => setGuideModalVisible(true)}
            />

            <SettingsModal
                visible={isSettingsModalVisible}
                onClose={() => setSettingsModalVisible(false)}
            />
            <TemplateModal
                visible={isTemplateModalVisible}
                onClose={() => {
                    setTemplateModalVisible(false);
                    refreshCategories();
                }}
            />
            <ActivityModal
                visible={isActivityModalVisible}
                onClose={() => setActivityModalVisible(false)}
            />
            <FeedbackModal
                visible={isFeedbackModalVisible}
                onClose={() => setFeedbackModalVisible(false)}
            />
            <UsageGuideModal
                visible={isGuideModalVisible}
                onClose={() => setGuideModalVisible(false)}
            />
            <TodoDetailModal
                visible={isDetailModalVisible}
                onClose={() => setDetailModalVisible(false)}
                todo={selectedTodo}
                onStartNow={handleTodoStartNow}
                onDelete={handleTodoDelete}
                onUpdate={handleTodoUpdate}
                onRecord={handleTodoRecord}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    mainContent: {
        flex: 1,
    },
    splitRow: {
        flex: 1,
        flexDirection: 'row',
    },
    todoPane: {
        borderRightWidth: 1,
    },
    schedulePane: {
        borderLeftWidth: 1,
    },
    calendarContainer: {
        borderBottomWidth: 1,
        overflow: 'hidden',
    }
});
