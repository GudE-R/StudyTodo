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
import { useThemeColors } from '../../providers/ThemeProvider';
import { useTodoHandlers } from '../../hooks/useTodoHandlers';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const MainLayoutSimple = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { categories, refreshCategories } = useMobileCategories();
    const { colors } = useThemeColors();
    const h = useTodoHandlers();

    // Calendar Mode (week / month)
    const [calendarMode, setCalendarMode] = useState<'week' | 'month'>('week');

    // Schedule expand mode
    const [scheduleExpanded, setScheduleExpanded] = useState(false);

    // Animated height for smooth transitions
    const calendarHeight = useRef(new Animated.Value(100)).current;
    const calendarTranslateX = useRef(new Animated.Value(0)).current;
    const todoFlex = useRef(new Animated.Value(7.5)).current;
    const scheduleFlex = useRef(new Animated.Value(2.5)).current;

    // Animate schedule width
    useEffect(() => {
        Animated.parallel([
            Animated.spring(todoFlex, { toValue: scheduleExpanded ? 4 : 7.5, friction: 10, tension: 40, useNativeDriver: false }),
            Animated.spring(scheduleFlex, { toValue: scheduleExpanded ? 6 : 2.5, friction: 10, tension: 40, useNativeDriver: false }),
        ]).start();
    }, [scheduleExpanded]);

    // Animate calendar height
    useEffect(() => {
        let targetHeight = 85;
        if (calendarMode === 'month') {
            const startDay = startOfMonth(currentDate).getDay();
            const daysInMonth = getDaysInMonth(currentDate);
            const totalSlots = startDay + daysInMonth;
            const rows = Math.ceil(totalSlots / 7);
            targetHeight = 58 + (rows * 60);
        }
        Animated.spring(calendarHeight, { toValue: targetHeight, friction: 12, tension: 40, useNativeDriver: false }).start();
    }, [calendarMode, currentDate]);

    // Week navigation
    const navigateWeek = (direction: 'next' | 'prev') => {
        setCurrentDate(d => {
            const newDate = new Date(d);
            newDate.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
            return newDate;
        });
    };

    const calendarModeRef = useRef(calendarMode);
    useEffect(() => { calendarModeRef.current = calendarMode; }, [calendarMode]);

    // Calendar swipe
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 10 || Math.abs(gs.dx) > 10,
            onPanResponderRelease: (_, gs) => {
                if (Math.abs(gs.dy) > Math.abs(gs.dx)) {
                    if (gs.dy > 30) setCalendarMode('month');
                    else if (gs.dy < -30) setCalendarMode('week');
                } else {
                    const mode = calendarModeRef.current;
                    if (gs.dx < -40) {
                        if (mode === 'week') navigateWeek('next');
                        else setCurrentDate(d => { const n = new Date(d); n.setMonth(d.getMonth() + 1); return n; });
                    } else if (gs.dx > 40) {
                        if (mode === 'week') navigateWeek('prev');
                        else setCurrentDate(d => { const n = new Date(d); n.setMonth(d.getMonth() - 1); return n; });
                    }
                }
            },
        })
    ).current;

    // Schedule pane swipe
    const schedulePanResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 20,
            onPanResponderRelease: (_, gs) => {
                if (gs.dx < -50) setScheduleExpanded(true);
                else if (gs.dx > 50) setScheduleExpanded(false);
            },
        })
    ).current;

    if (h.viewMode === "timer" && h.activeTodo) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <AdBanner />
                <MobileTimerView
                    todo={h.activeTodo}
                    onBack={h.handleTimerBack}
                    onSaveSession={h.handleSaveSession}
                    onCompleteTask={h.handleCompleteTask}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <AdBanner />

            <Animated.View
                style={[styles.calendarContainer, { borderColor: colors.border, height: calendarHeight, transform: [{ translateX: calendarTranslateX }] }]}
                {...panResponder.panHandlers}
            >
                <HomeCalendar
                    currentDate={currentDate}
                    onDateSelect={setCurrentDate}
                    keptDate={h.keptDate}
                    onDateLongPress={(date) => h.handleDateLongPress(date)}
                    viewMode={calendarMode}
                />
            </Animated.View>

            <View style={[styles.mainContent, { backgroundColor: colors.background }]}>
                <View style={styles.splitRow}>
                    <Animated.View style={[styles.todoPane, { borderColor: colors.border, flex: todoFlex }]}>
                        <HomeTodoList date={currentDate} onTodoPress={h.handleTodoPress} />
                    </Animated.View>

                    <Animated.View
                        style={[styles.schedulePane, { borderColor: colors.border, flex: scheduleFlex }]}
                        {...schedulePanResponder.panHandlers}
                    >
                        <HomeDaySchedule
                            currentDate={currentDate}
                            onDateChange={setCurrentDate}
                            keptDate={h.keptDate}
                            keptTime={h.keptTime}
                            onTimeLongPress={(date, time) => h.handleTimeLongPress(date, time)}
                        />
                    </Animated.View>
                </View>
            </View>

            <Footer
                onOpenTemplate={() => h.setTemplateModalVisible(true)}
                onOpenTodo={() => h.setTodoModalVisible(true)}
                onOpenReport={() => h.setActivityModalVisible(true)}
                onOpenMenu={() => h.setMenuModalVisible(true)}
                isHighlighted={!!h.keptDate || !!h.keptTime}
                onResetKeep={h.handleResetKeep}
            />

            <TodoCreateModal
                visible={h.isTodoModalVisible}
                onClose={() => h.setTodoModalVisible(false)}
                categories={categories}
                initialDate={h.keptDate || undefined}
                initialTime={h.keptTime || undefined}
                onStartNow={h.handleStartNow}
            />

            <MenuModal
                visible={h.isMenuModalVisible}
                onClose={() => h.setMenuModalVisible(false)}
                onOpenSettings={() => h.setSettingsModalVisible(true)}
                onOpenFeedback={() => h.setFeedbackModalVisible(true)}
                onOpenGuide={() => h.setGuideModalVisible(true)}
            />

            <SettingsModal visible={h.isSettingsModalVisible} onClose={() => h.setSettingsModalVisible(false)} />
            <TemplateModal visible={h.isTemplateModalVisible} onClose={() => { h.setTemplateModalVisible(false); refreshCategories(); }} />
            <ActivityModal visible={h.isActivityModalVisible} onClose={() => h.setActivityModalVisible(false)} />
            <FeedbackModal visible={h.isFeedbackModalVisible} onClose={() => h.setFeedbackModalVisible(false)} />
            <UsageGuideModal visible={h.isGuideModalVisible} onClose={() => h.setGuideModalVisible(false)} />
            <TodoDetailModal
                visible={h.isDetailModalVisible}
                onClose={() => h.setDetailModalVisible(false)}
                todo={h.selectedTodo}
                onStartNow={h.handleTodoStartNow}
                onDelete={h.handleTodoDelete}
                onUpdate={h.handleTodoUpdate}
                onRecord={h.handleTodoRecord}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    mainContent: { flex: 1 },
    splitRow: { flex: 1, flexDirection: 'row' },
    todoPane: { borderRightWidth: 1 },
    schedulePane: { borderLeftWidth: 1 },
    calendarContainer: { borderBottomWidth: 1, overflow: 'hidden' },
});
