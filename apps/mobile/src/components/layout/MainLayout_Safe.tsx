import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdBanner } from './AdBanner';
import { Header } from './Header';
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

import { useMobileCategories } from '../../hooks/useMobileCategories';
import { useThemeColors } from '../../providers/ThemeProvider';
import { useTodoHandlers } from '../../hooks/useTodoHandlers';
import { useState } from 'react';

export const MainLayout = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { categories, refreshCategories } = useMobileCategories();
    const { colors } = useThemeColors();
    const h = useTodoHandlers();

    if (h.viewMode === "timer" && h.activeTodo) {
        return (
            <SafeAreaView style={styles.safeArea}>
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
            <Header
                date={currentDate}
                onOpenSettings={() => h.setSettingsModalVisible(true)}
                onOpenFeedback={() => h.setFeedbackModalVisible(true)}
                onOpenGuide={() => h.setGuideModalVisible(true)}
                onPrevDate={() => setCurrentDate(d => {
                    const safeD = (d instanceof Date && !isNaN(d.getTime())) ? d : new Date();
                    const newDate = new Date(safeD);
                    newDate.setDate(safeD.getDate() - 1);
                    return newDate;
                })}
                onNextDate={() => setCurrentDate(d => {
                    const safeD = (d instanceof Date && !isNaN(d.getTime())) ? d : new Date();
                    const newDate = new Date(safeD);
                    newDate.setDate(safeD.getDate() + 1);
                    return newDate;
                })}
            />

            <View style={[styles.mainContent, { backgroundColor: colors.background }]}>
                <View style={styles.splitRow}>
                    <View style={[styles.paneHalf, { borderColor: colors.border }]}>
                        <HomeTodoList date={currentDate} onTodoPress={h.handleTodoPress} />
                    </View>
                    <View style={[styles.paneHalf, { borderColor: colors.border }]}>
                        <HomeDaySchedule
                            currentDate={currentDate}
                            onDateChange={setCurrentDate}
                            keptDate={h.keptDate}
                            keptTime={h.keptTime}
                            onTimeLongPress={(date, time) => h.handleTimeLongPress(date, time)}
                        />
                    </View>
                </View>
                <View style={[styles.calendarPane, { borderColor: colors.border }]}>
                    <HomeCalendar
                        currentDate={currentDate}
                        onDateSelect={setCurrentDate}
                        keptDate={h.keptDate}
                        onDateLongPress={(date) => h.handleDateLongPress(date)}
                    />
                </View>
            </View>

            <Footer
                onOpenTemplate={() => h.setTemplateModalVisible(true)}
                onOpenTodo={() => h.setTodoModalVisible(true)}
                onOpenReport={() => h.setActivityModalVisible(true)}
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
    paneHalf: { flex: 1, borderWidth: 1 },
    calendarPane: { height: 150, borderTopWidth: 1 },
});
