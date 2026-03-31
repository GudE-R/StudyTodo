import React, { useState, useRef, useEffect } from 'react';
import { startOfMonth, getDaysInMonth } from 'date-fns';
import { View, StyleSheet, PanResponder, Animated, LayoutAnimation, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react-native';

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

import { JournalModal } from '../journal/JournalModal';
import { useMobileCategories } from '../../hooks/useMobileCategories';
import { useThemeColors } from '../../providers/ThemeProvider';
import { useTodoHandlers } from '../../hooks/useTodoHandlers';
import { useJournalSettings } from '../../hooks/useJournal';


const LAYOUT_ANIM = LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.scaleXY);

export const MainLayoutSimple = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { categories, refreshCategories } = useMobileCategories();
    const { colors } = useThemeColors();
    const h = useTodoHandlers();
    const { settings: journalSettings } = useJournalSettings();
    const [isJournalVisible, setJournalVisible] = useState(false);

    // Calendar Mode (week / month)
    const [calendarMode, setCalendarMode] = useState<'week' | 'month'>('week');

    // Schedule expand mode
    const [scheduleExpanded, setScheduleExpanded] = useState(false);

    // Animated height for calendar only (height cannot use LayoutAnimation easily)
    const calendarHeight = useRef(new Animated.Value(85)).current;

    // Animate calendar height
    useEffect(() => {
        let targetHeight = 85;
        if (calendarMode === 'month') {
            const startDay = startOfMonth(currentDate).getDay();
            const daysInMonth = getDaysInMonth(currentDate);
            const rows = Math.ceil((startDay + daysInMonth) / 7);
            targetHeight = 58 + rows * 60;
        }
        Animated.timing(calendarHeight, { toValue: targetHeight, duration: 200, useNativeDriver: false }).start();
    }, [calendarMode, currentDate]);

    // Toggle calendar mode (height is handled by Animated.timing in useEffect)
    const toggleCalendarMode = () => {
        setCalendarMode(m => m === 'week' ? 'month' : 'week');
    };

    // Toggle schedule — LayoutAnimation handles the flex change on the native layout engine
    const scheduleExpandedRef = useRef(false);
    const toggleSchedule = (expand: boolean) => {
        scheduleExpandedRef.current = expand;
        LayoutAnimation.configureNext(LAYOUT_ANIM);
        setScheduleExpanded(expand);
    };

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
    const toggleScheduleRef = useRef(toggleSchedule);
    toggleScheduleRef.current = toggleSchedule;
    const schedulePanResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
            onPanResponderRelease: (_, gs) => {
                if (gs.dx < -30) toggleScheduleRef.current(true);
                else if (gs.dx > 30) toggleScheduleRef.current(false);
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
                style={[styles.calendarContainer, { borderColor: colors.border, height: calendarHeight }]}
                {...panResponder.panHandlers}
            >
                <HomeCalendar
                    currentDate={currentDate}
                    onDateSelect={setCurrentDate}
                    keptDate={h.keptDate}
                    onDateLongPress={(date) => h.handleDateLongPress(date)}
                    viewMode={calendarMode}
                />
                <TouchableOpacity
                    style={[styles.calendarToggle, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={toggleCalendarMode}
                    activeOpacity={0.6}
                    hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                >
                    {calendarMode === 'month'
                        ? <ChevronUp size={12} color={colors.text} />
                        : <ChevronDown size={12} color={colors.text} />
                    }
                </TouchableOpacity>
            </Animated.View>

            <View style={[styles.mainContent, { backgroundColor: colors.background }]}>
                <View style={styles.splitRow}>
                    <View style={[styles.todoPane, { flex: scheduleExpanded ? 4 : 7.5 }]}>
                        <HomeTodoList date={currentDate} onTodoPress={h.handleTodoPress} />
                    </View>

                    <TouchableOpacity
                        style={[styles.dividerToggle, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => toggleSchedule(!scheduleExpandedRef.current)}
                        activeOpacity={0.6}
                        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                    >
                        {scheduleExpanded
                            ? <ChevronRight size={14} color={colors.text} />
                            : <ChevronLeft size={14} color={colors.text} />
                        }
                    </TouchableOpacity>

                    <View
                        style={[styles.schedulePane, { flex: scheduleExpanded ? 6 : 2.5 }]}
                        {...schedulePanResponder.panHandlers}
                    >
                        <HomeDaySchedule
                            currentDate={currentDate}
                            onDateChange={setCurrentDate}
                            keptDate={h.keptDate}
                            keptTime={h.keptTime}
                            onTimeLongPress={(date, time) => h.handleTimeLongPress(date, time)}
                        />
                    </View>
                </View>
            </View>

            <Footer
                onOpenTemplate={() => h.setTemplateModalVisible(true)}
                onOpenTodo={() => h.setTodoModalVisible(true)}
                onOpenReport={() => h.setActivityModalVisible(true)}
                onOpenMenu={() => h.setMenuModalVisible(true)}
                onOpenJournal={() => setJournalVisible(true)}
                journalEnabled={journalSettings.enabled}
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
            <JournalModal visible={isJournalVisible} onClose={() => setJournalVisible(false)} />
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
    todoPane: { overflow: 'hidden' },
    schedulePane: { overflow: 'hidden' },
    calendarContainer: { borderBottomWidth: 1, overflow: 'hidden' },
    calendarToggle: {
        position: 'absolute',
        bottom: 0,
        end: 0,
        width: 32,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopStartRadius: 6,
        borderTopWidth: 1,
        borderStartWidth: 1,
    },
    dividerToggle: {
        width: 16,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderStartWidth: 1,
    },
});
